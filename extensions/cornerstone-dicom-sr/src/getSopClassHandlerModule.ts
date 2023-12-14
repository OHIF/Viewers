import { utils, classes, DisplaySetService, Types } from '@ohif/core';
import cloneDeep from 'lodash.clonedeep';

import addMeasurement from './utils/addMeasurement';
import isRehydratable from './utils/isRehydratable';
import { SOPClassHandlerName, SOPClassHandlerId } from './id';
import {
  CodeNameCodeSequenceValues,
  CodingSchemeDesignators,
  RELATIONSHIP_TYPE,
  CORNERSTONE_FREETEXT_CODE_VALUE,
} from './enums';

type InstanceMetadata = Types.InstanceMetadata;

const { ImageSet, MetadataProvider: metadataProvider } = classes;

/**
 * TODO
 * - [ ] Add SR thumbnail
 * - [ ] Make viewport
 * - [ ] Get stacks from referenced displayInstanceUID and load into wrapped CornerStone viewport
 */

const sopClassUids = [
  '1.2.840.10008.5.1.4.1.1.88.11' /** BASIC_TEXT_SR */,
  '1.2.840.10008.5.1.4.1.1.88.22' /** ENHANCED_SR */,
  '1.2.840.10008.5.1.4.1.1.88.33' /** COMPREHENSIVE_SR */,
  '1.2.840.10008.5.1.4.1.1.88.34' /** COMPREHENSIVE_3D_SR */,
];

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';

const validateSameStudyUID = (uid: string, instances): void => {
  instances.forEach(it => {
    if (it.StudyInstanceUID !== uid) {
      console.warn('Not all instances have the same UID', uid, it);
      throw new Error(`Instances ${it.SOPInstanceUID} does not belong to ${uid}`);
    }
  });
};

/**
 * Adds instances to the DICOM SR series, rather than creating a new
 * series, so that as SR's are saved, they append to the series, and the
 * key image display set gets updated as well, containing just the new series.
 * @param instances is a list of instances from THIS series that are not
 *     in this DICOM SR Display Set already.
 */
function addInstances(instances: InstanceMetadata[], displaySetService: DisplaySetService) {
  this.instances.push(...instances);
  utils.sortStudyInstances(this.instances);
  // The last instance is the newest one, so is the one most interesting.
  // Eventually, the SR viewer should have the ability to choose which SR
  // gets loaded, and to navigate among them.
  this.instance = this.instances[this.instances.length - 1];
  this.isLoaded = false;
  return this;
}

/**
 * DICOM SR SOP Class Handler
 * For all referenced images in the TID 1500/300 sections, add an image to the
 * display.
 * @param instances is a set of instances all from the same series
 * @param servicesManager is the services that can be used for creating
 * @returns The list of display sets created for the given instances object
 */
function _getDisplaySetsFromSeries(instances, servicesManager, extensionManager) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  utils.sortStudyInstances(instances);
  // The last instance is the newest one, so is the one most interesting.
  // Eventually, the SR viewer should have the ability to choose which SR
  // gets loaded, and to navigate among them.
  const instance = instances[instances.length - 1];

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    ConceptNameCodeSequence,
    SOPClassUID,
  } = instance;
  validateSameStudyUID(instance.StudyInstanceUID, instances);

  if (
    !ConceptNameCodeSequence ||
    ConceptNameCodeSequence.CodeValue !== CodeNameCodeSequenceValues.ImagingMeasurementReport
  ) {
    servicesManager.services.uiNotificationService.show({
      title: 'DICOM SR',
      message:
        'OHIF only supports TID1500 Imaging Measurement Report Structured Reports. The SR you are trying to view is not supported.',
      type: 'warning',
      duration: 6000,
    });
    return [];
  }

  const displaySet = {
    //plugin: id,
    Modality: 'SR',
    displaySetInstanceUID: utils.guid(),
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    instances,
    referencedImages: null,
    measurements: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    sopClassUids,
    instance,
    addInstances,
  };

  displaySet.load = () => _load(displaySet, servicesManager, extensionManager);

  return [displaySet];
}

/**
 * Loads the display set with the given services and extension manager.
 * @param {Object} displaySet - The display set to load.
 * @param {Object} servicesManager - The services manager containing displaySetService and measurementService.
 * @param {Object} extensionManager - The extension manager containing data sources.
 */
function _load(displaySet, servicesManager, extensionManager) {
  const { displaySetService, measurementService } = servicesManager.services;
  const dataSource = extensionManager.getActiveDataSource()[0];

  const { ContentSequence } = displaySet.instance;
  displaySet.referencedImages = _getReferencedImagesList(ContentSequence);
  displaySet.measurements = _getMeasurements(ContentSequence);

  const mappings = measurementService.getSourceMappings(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  displaySet.isHydrated = false;
  displaySet.isRehydratable = isRehydratable(displaySet, mappings);
  displaySet.isLoaded = true;

  /** Check currently added displaySets and add measurements if the sources exist */
  displaySetService.activeDisplaySets.forEach(activeDisplaySet => {
    _checkIfCanAddMeasurementsToDisplaySet(displaySet, activeDisplaySet, dataSource);
  });

  /** Subscribe to new displaySets as the source may come in after */
  displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, data => {
    const { displaySetsAdded } = data;
    /**
     * If there are still some measurements that have not yet been loaded into cornerstone,
     * See if we can load them onto any of the new displaySets.
     */
    displaySetsAdded.forEach(newDisplaySet => {
      _checkIfCanAddMeasurementsToDisplaySet(displaySet, newDisplaySet, dataSource);
    });
  });
}

/**
 * Checks if measurements can be added to a display set.
 *
 * @param srDisplaySet - The source display set containing measurements.
 * @param newDisplaySet - The new display set to check if measurements can be added.
 * @param dataSource - The data source used to retrieve image IDs.
 */
function _checkIfCanAddMeasurementsToDisplaySet(srDisplaySet, newDisplaySet, dataSource) {
  /** Investigate why without deepClone the measurements are not rendering */
  let unloadedMeasurements = cloneDeep(srDisplaySet.measurements).filter(
    measurement => measurement.loaded === false
  );

  /** All measurements were loaded */
  if (unloadedMeasurements.length === 0) {
    return;
  }

  if (!(newDisplaySet instanceof ImageSet)) {
    return;
  }

  if (newDisplaySet.unsupported) {
    return;
  }

  const { sopClassUids, images } = newDisplaySet;

  /** Check if any have the newDisplaySet is the correct SOPClass */
  unloadedMeasurements = unloadedMeasurements.filter(measurement =>
    measurement.coords.some(coord => {
      /** Find reference sop instance uid by frame of reference if not present */
      if (coord.ReferencedSOPSequence === undefined) {
        for (let i = 0; i < images.length; ++i) {
          const imageMetadata = images[i];
          if (imageMetadata.FrameOfReferenceUID !== coord.ReferencedFrameOfReferenceSequence) {
            continue;
          }

          const sliceNormal = [0, 0, 0];
          const orientation = imageMetadata.ImageOrientationPatient;
          sliceNormal[0] = orientation[1] * orientation[5] - orientation[2] * orientation[4];
          sliceNormal[1] = orientation[2] * orientation[3] - orientation[0] * orientation[5];
          sliceNormal[2] = orientation[0] * orientation[4] - orientation[1] * orientation[3];

          let distanceAlongNormal = 0;
          for (let j = 0; j < 3; ++j) {
            distanceAlongNormal += sliceNormal[j] * imageMetadata.ImagePositionPatient[j];
          }

          // assuming 5 mm tolerance
          if (Math.abs(distanceAlongNormal - coord.GraphicData[2]) > 5) {
            continue;
          }

          coord.ReferencedSOPSequence = {
            ReferencedSOPClassUID: imageMetadata.SOPClassUID,
            ReferencedSOPInstanceUID: imageMetadata.SOPInstanceUID,
          };

          break;
        }

        if (coord.ReferencedSOPSequence === undefined) {
          return false;
        }
      }

      return sopClassUids.includes(coord.ReferencedSOPSequence.ReferencedSOPClassUID);
    })
  );

  if (unloadedMeasurements.length === 0) {
    /** New displaySet isn't the correct SOPClassso can't contain the referenced images */
    return;
  }

  const SOPInstanceUIDs = [];
  unloadedMeasurements.forEach(measurement => {
    measurement.coords.forEach(({ ReferencedSOPSequence }) => {
      const SOPInstanceUID = ReferencedSOPSequence.ReferencedSOPInstanceUID;
      if (!SOPInstanceUIDs.includes(SOPInstanceUID)) {
        SOPInstanceUIDs.push(SOPInstanceUID);
      }
    });
  });

  const imageIds = dataSource.getImageIdsForDisplaySet(newDisplaySet);
  for (const imageId of imageIds) {
    const { SOPInstanceUID, frameNumber } = metadataProvider.getUIDsFromImageID(imageId);
    if (SOPInstanceUIDs.includes(SOPInstanceUID)) {
      for (let j = unloadedMeasurements.length - 1; j >= 0; j--) {
        const measurement = unloadedMeasurements[j];
        if (_measurementReferencesSOPInstanceUID(measurement, SOPInstanceUID, frameNumber)) {
          addMeasurement(measurement, imageId, newDisplaySet.displaySetInstanceUID);
          unloadedMeasurements.splice(j, 1);
        }
      }
    }
  }
}

/**
 * Checks if a measurement references a specific SOP Instance UID.
 * @param measurement - The measurement object.
 * @param SOPInstanceUID - The SOP Instance UID to check against.
 * @param frameNumber - The frame number to check against (optional).
 * @returns True if the measurement references the specified SOP Instance UID, false otherwise.
 */
function _measurementReferencesSOPInstanceUID(measurement, SOPInstanceUID, frameNumber) {
  const { coords } = measurement;

  /**
   * NOTE: The ReferencedFrameNumber can be multiple values according to the DICOM
   * Standard. But for now, we will support only one ReferenceFrameNumber.
   */
  const firstCoord = measurement.coords[0];
  const ReferencedFrameNumber =
    (firstCoord.ReferencedSOPSequence &&
      firstCoord.ReferencedSOPSequence[0]?.ReferencedFrameNumber) ||
    1;

  if (frameNumber && Number(frameNumber) !== Number(ReferencedFrameNumber)) {
    return false;
  }

  for (let j = 0; j < coords.length; j++) {
    const coord = coords[j];
    const { ReferencedSOPInstanceUID } = coord.ReferencedSOPSequence;
    if (ReferencedSOPInstanceUID === SOPInstanceUID) {
      return true;
    }
  }

  return false;
}

/**
 * Retrieves the SOP class handler module.
 *
 * @param {Object} options - The options for retrieving the SOP class handler module.
 * @param {Object} options.servicesManager - The services manager.
 * @param {Object} options.extensionManager - The extension manager.
 * @returns {Array} An array containing the SOP class handler module.
 */
function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };
  return [
    {
      name: SOPClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

/**
 * Retrieves the measurements from the ImagingMeasurementReportContentSequence.
 *
 * @param {Array} ImagingMeasurementReportContentSequence - The ImagingMeasurementReportContentSequence array.
 * @returns {Array} - The array of measurements.
 */
function _getMeasurements(ImagingMeasurementReportContentSequence) {
  const ImagingMeasurements = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.ImagingMeasurements
  );

  const MeasurementGroups = _getSequenceAsArray(ImagingMeasurements.ContentSequence).filter(
    item => item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.MeasurementGroup
  );

  const mergedContentSequencesByTrackingUniqueIdentifiers =
    _getMergedContentSequencesByTrackingUniqueIdentifiers(MeasurementGroups);

  const measurements = [];

  Object.keys(mergedContentSequencesByTrackingUniqueIdentifiers).forEach(
    trackingUniqueIdentifier => {
      const mergedContentSequence =
        mergedContentSequencesByTrackingUniqueIdentifiers[trackingUniqueIdentifier];

      const measurement = _processMeasurement(mergedContentSequence);
      if (measurement) {
        measurements.push(measurement);
      }
    }
  );

  return measurements;
}

/**
 * Retrieves merged content sequences by tracking unique identifiers.
 *
 * @param {Array} MeasurementGroups - The measurement groups.
 * @returns {Object} - The merged content sequences by tracking unique identifiers.
 */
function _getMergedContentSequencesByTrackingUniqueIdentifiers(MeasurementGroups) {
  const mergedContentSequencesByTrackingUniqueIdentifiers = {};

  MeasurementGroups.forEach(MeasurementGroup => {
    const ContentSequence = _getSequenceAsArray(MeasurementGroup.ContentSequence);

    const TrackingUniqueIdentifierItem = ContentSequence.find(
      item =>
        item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.TrackingUniqueIdentifier
    );
    if (!TrackingUniqueIdentifierItem) {
      console.warn('No Tracking Unique Identifier, skipping ambiguous measurement.');
    }

    const trackingUniqueIdentifier = TrackingUniqueIdentifierItem.UID;

    if (mergedContentSequencesByTrackingUniqueIdentifiers[trackingUniqueIdentifier] === undefined) {
      // Add the full ContentSequence
      mergedContentSequencesByTrackingUniqueIdentifiers[trackingUniqueIdentifier] = [
        ...ContentSequence,
      ];
    } else {
      // Add the ContentSequence minus the tracking identifier, as we have this
      // Information in the merged ContentSequence anyway.
      ContentSequence.forEach(item => {
        if (
          item.ConceptNameCodeSequence.CodeValue !==
          CodeNameCodeSequenceValues.TrackingUniqueIdentifier
        ) {
          mergedContentSequencesByTrackingUniqueIdentifiers[trackingUniqueIdentifier].push(item);
        }
      });
    }
  });

  return mergedContentSequencesByTrackingUniqueIdentifiers;
}

/**
 * Processes the measurement based on the merged content sequence.
 * If the merged content sequence contains SCOORD or SCOORD3D value types,
 * it calls the _processTID1410Measurement function.
 * Otherwise, it calls the _processNonGeometricallyDefinedMeasurement function.
 *
 * @param {Array<Object>} mergedContentSequence - The merged content sequence to process.
 * @returns {any} - The processed measurement result.
 */
function _processMeasurement(mergedContentSequence) {
  if (
    mergedContentSequence.some(
      group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
    )
  ) {
    return _processTID1410Measurement(mergedContentSequence);
  }

  return _processNonGeometricallyDefinedMeasurement(mergedContentSequence);
}

/**
 * Processes TID 1410 style measurements from the mergedContentSequence.
 * TID 1410 style measurements have a SCOORD or SCOORD3D at the top level,
 * and non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D.
 *
 * @param mergedContentSequence - The merged content sequence containing the measurements.
 * @returns The measurement object containing the loaded status, labels, coordinates, tracking unique identifier, and tracking identifier.
 */
function _processTID1410Measurement(mergedContentSequence) {
  // Need to deal with TID 1410 style measurements, which will have a SCOORD or SCOORD3D at the top level,
  // And non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D

  const graphicItem = mergedContentSequence.find(
    group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
  );

  const UIDREFContentItem = mergedContentSequence.find(group => group.ValueType === 'UIDREF');

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    item => item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.TrackingIdentifier
  );

  if (!graphicItem) {
    console.warn(
      `graphic ValueType ${graphicItem.ValueType} not currently supported, skipping annotation.`
    );
    return;
  }

  const NUMContentItems = mergedContentSequence.filter(group => group.ValueType === 'NUM');

  const measurement = {
    loaded: false,
    labels: [],
    coords: [_getCoordsFromSCOORDOrSCOORD3D(graphicItem)],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  NUMContentItems.forEach(item => {
    const { ConceptNameCodeSequence, MeasuredValueSequence } = item;
    if (MeasuredValueSequence) {
      measurement.labels.push(
        _getLabelFromMeasuredValueSequence(ConceptNameCodeSequence, MeasuredValueSequence)
      );
    }
  });

  const findingSites = mergedContentSequence.filter(
    item =>
      item.ConceptNameCodeSequence.CodingSchemeDesignator === CodingSchemeDesignators.SCT &&
      item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.FindingSiteSCT
  );
  if (findingSites.length) {
    measurement.labels.push({
      label: CodeNameCodeSequenceValues.FindingSiteSCT,
      value: findingSites[0].ConceptCodeSequence.CodeMeaning,
    });
  }

  return measurement;
}

/**
 * Processes the non-geometrically defined measurement from the merged content sequence.
 *
 * @param mergedContentSequence The merged content sequence containing the measurement data.
 * @returns The processed measurement object.
 */
function _processNonGeometricallyDefinedMeasurement(mergedContentSequence) {
  const NUMContentItems = mergedContentSequence.filter(group => group.ValueType === 'NUM');
  const UIDREFContentItem = mergedContentSequence.find(group => group.ValueType === 'UIDREF');

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    item => item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.TrackingIdentifier
  );

  const finding = mergedContentSequence.find(
    item => item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.Finding
  );

  const findingSites = mergedContentSequence.filter(
    item =>
      item.ConceptNameCodeSequence.CodingSchemeDesignator === CodingSchemeDesignators.SRT &&
      item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.FindingSite
  );

  const measurement = {
    loaded: false,
    labels: [],
    coords: [],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  if (
    finding &&
    CodingSchemeDesignators.CornerstoneCodeSchemes.includes(
      finding.ConceptCodeSequence.CodingSchemeDesignator
    ) &&
    finding.ConceptCodeSequence.CodeValue === CodeNameCodeSequenceValues.CornerstoneFreeText
  ) {
    measurement.labels.push({
      label: CORNERSTONE_FREETEXT_CODE_VALUE,
      value: finding.ConceptCodeSequence.CodeMeaning,
    });
  }

  // TODO -> Eventually hopefully support SNOMED or some proper code library, just free text for now.
  if (findingSites.length) {
    const cornerstoneFreeTextFindingSite = findingSites.find(
      FindingSite =>
        CodingSchemeDesignators.CornerstoneCodeSchemes.includes(
          FindingSite.ConceptCodeSequence.CodingSchemeDesignator
        ) &&
        FindingSite.ConceptCodeSequence.CodeValue === CodeNameCodeSequenceValues.CornerstoneFreeText
    );

    if (cornerstoneFreeTextFindingSite) {
      measurement.labels.push({
        label: CORNERSTONE_FREETEXT_CODE_VALUE,
        value: cornerstoneFreeTextFindingSite.ConceptCodeSequence.CodeMeaning,
      });
    }
  }

  NUMContentItems.forEach(item => {
    const { ConceptNameCodeSequence, ContentSequence, MeasuredValueSequence } = item;

    const { ValueType } = ContentSequence;
    if (!ValueType === 'SCOORD') {
      console.warn(`Graphic ${ValueType} not currently supported, skipping annotation.`);
      return;
    }

    const coords = _getCoordsFromSCOORDOrSCOORD3D(ContentSequence);
    if (coords) {
      measurement.coords.push(coords);
    }

    if (MeasuredValueSequence) {
      measurement.labels.push(
        _getLabelFromMeasuredValueSequence(ConceptNameCodeSequence, MeasuredValueSequence)
      );
    }
  });

  return measurement;
}

/**
 * Extracts coordinates from a graphic item of type SCOORD or SCOORD3D.
 * @param {object} graphicItem - The graphic item containing the coordinates.
 * @returns {object} - The extracted coordinates.
 */
const _getCoordsFromSCOORDOrSCOORD3D = graphicItem => {
  const { ValueType, GraphicType, GraphicData } = graphicItem;
  const coords = { ValueType, GraphicType, GraphicData };

  if (ValueType === 'SCOORD') {
    const { ReferencedSOPSequence } = graphicItem.ContentSequence;
    coords.ReferencedSOPSequence = ReferencedSOPSequence;
  } else if (ValueType === 'SCOORD3D') {
    if (graphicItem.ReferencedFrameOfReferenceUID) {
      coords.ReferencedFrameOfReferenceSequence = graphicItem.ReferencedFrameOfReferenceUID;
    } else if (graphicItem.ContentSequence) {
      const { ReferencedFrameOfReferenceSequence } = graphicItem.ContentSequence;
      coords.ReferencedFrameOfReferenceSequence = ReferencedFrameOfReferenceSequence;
    }
  }

  return coords;
};

/**
 * Retrieves the label and value from the provided ConceptNameCodeSequence and MeasuredValueSequence.
 * @param {Object} ConceptNameCodeSequence - The ConceptNameCodeSequence object.
 * @param {Object} MeasuredValueSequence - The MeasuredValueSequence object.
 * @returns {Object} - An object containing the label and value.
 *                    The label represents the CodeMeaning from the ConceptNameCodeSequence.
 *                    The value represents the formatted NumericValue and CodeValue from the MeasuredValueSequence.
 *                    Example: { label: 'Long Axis', value: '31.00 mm' }
 */
function _getLabelFromMeasuredValueSequence(ConceptNameCodeSequence, MeasuredValueSequence) {
  const { CodeMeaning } = ConceptNameCodeSequence;
  const { NumericValue, MeasurementUnitsCodeSequence } = MeasuredValueSequence;
  const { CodeValue } = MeasurementUnitsCodeSequence;
  const formatedNumericValue = NumericValue ? Number(NumericValue).toFixed(2) : '';
  return {
    label: CodeMeaning,
    value: `${formatedNumericValue} ${CodeValue}`,
  }; // E.g. Long Axis: 31.0 mm
}

/**
 * Retrieves a list of referenced images from the Imaging Measurement Report Content Sequence.
 *
 * @param {Array} ImagingMeasurementReportContentSequence - The Imaging Measurement Report Content Sequence.
 * @returns {Array} - The list of referenced images.
 */
function _getReferencedImagesList(ImagingMeasurementReportContentSequence) {
  const ImageLibrary = ImagingMeasurementReportContentSequence.find(
    item => item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.ImageLibrary
  );

  const ImageLibraryGroup = _getSequenceAsArray(ImageLibrary.ContentSequence).find(
    item => item.ConceptNameCodeSequence.CodeValue === CodeNameCodeSequenceValues.ImageLibraryGroup
  );
  if (!ImageLibraryGroup) {
    return [];
  }

  const referencedImages = [];

  _getSequenceAsArray(ImageLibraryGroup.ContentSequence).forEach(item => {
    const { ReferencedSOPSequence } = item;
    if (!ReferencedSOPSequence) {
      return;
    }
    for (const ref of _getSequenceAsArray(ReferencedSOPSequence)) {
      if (ref.ReferencedSOPClassUID) {
        const { ReferencedSOPClassUID, ReferencedSOPInstanceUID } = ref;

        referencedImages.push({
          ReferencedSOPClassUID,
          ReferencedSOPInstanceUID,
        });
      }
    }
  });

  return referencedImages;
}

/**
 * Converts a DICOM sequence to an array.
 * If the sequence is null or undefined, an empty array is returned.
 * If the sequence is already an array, it is returned as is.
 * Otherwise, the sequence is wrapped in an array and returned.
 *
 * @param {any} sequence - The DICOM sequence to convert.
 * @returns {any[]} - The converted array.
 */
function _getSequenceAsArray(sequence) {
  if (!sequence) {
    return [];
  }
  return Array.isArray(sequence) ? sequence : [sequence];
}

export default getSopClassHandlerModule;
