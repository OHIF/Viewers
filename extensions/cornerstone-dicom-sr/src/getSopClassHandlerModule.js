import { SOPClassHandlerName, SOPClassHandlerId } from './id';
import { utils, classes } from '@ohif/core';
import addMeasurement from './utils/addMeasurement';
import isRehydratable from './utils/isRehydratable';
import { adaptersSR } from '@cornerstonejs/adapters';

const { CodeScheme: Cornerstone3DCodeScheme } = adaptersSR.Cornerstone3D;

const { ImageSet, MetadataProvider: metadataProvider } = classes;
// TODO ->
// Add SR thumbnail
// Make viewport
// Get stacks from referenced displayInstanceUID and load into wrapped CornerStone viewport.

const sopClassUids = [
  '1.2.840.10008.5.1.4.1.1.88.11', //BASIC_TEXT_SR:
  '1.2.840.10008.5.1.4.1.1.88.22', //ENHANCED_SR:
  '1.2.840.10008.5.1.4.1.1.88.33', //COMPREHENSIVE_SR:
  '1.2.840.10008.5.1.4.1.1.88.34', //COMPREHENSIVE_3D_SR:
];

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';

const CodeNameCodeSequenceValues = {
  ImagingMeasurementReport: '126000',
  ImageLibrary: '111028',
  ImagingMeasurements: '126010',
  MeasurementGroup: '125007',
  ImageLibraryGroup: '126200',
  TrackingUniqueIdentifier: '112040',
  TrackingIdentifier: '112039',
  Finding: '121071',
  FindingSite: 'G-C0E3', // SRT
  CornerstoneFreeText: Cornerstone3DCodeScheme.codeValues.CORNERSTONEFREETEXT, //
};

const CodingSchemeDesignators = {
  SRT: 'SRT',
  CornerstoneCodeSchemes: [
    Cornerstone3DCodeScheme.CodingSchemeDesignator,
    'CST4',
  ],
};

const RELATIONSHIP_TYPE = {
  INFERRED_FROM: 'INFERRED FROM',
  CONTAINS: 'CONTAINS',
};

const CORNERSTONE_FREETEXT_CODE_VALUE = 'CORNERSTONEFREETEXT';

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create
 *   a displaySet with a stack of images
 *
 * @param {Array} sopClassHandlerModules List of SOP Class Modules
 * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
 * @returns {Array} The list of display sets created for the given series object
 */
function _getDisplaySetsFromSeries(
  instances,
  servicesManager,
  extensionManager
) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const instance = instances[0];

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

  if (
    !ConceptNameCodeSequence ||
    ConceptNameCodeSequence.CodeValue !==
      CodeNameCodeSequenceValues.ImagingMeasurementReport
  ) {
    console.warn(
      'Only support Imaging Measurement Report SRs (TID1500) for now'
    );
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
    referencedImages: null,
    measurements: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    sopClassUids,
    instance,
  };

  displaySet.load = () => _load(displaySet, servicesManager, extensionManager);

  return [displaySet];
}

function _load(displaySet, servicesManager, extensionManager) {
  const { DisplaySetService, MeasurementService } = servicesManager.services;
  const dataSources = extensionManager.getDataSources();
  const dataSource = dataSources[0];

  const { ContentSequence } = displaySet.instance;

  displaySet.referencedImages = _getReferencedImagesList(ContentSequence);
  displaySet.measurements = _getMeasurements(ContentSequence);

  const mappings = MeasurementService.getSourceMappings(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  displaySet.isHydrated = false;
  displaySet.isRehydratable = isRehydratable(displaySet, mappings);
  displaySet.isLoaded = true;

  // Check currently added displaySets and add measurements if the sources exist.
  DisplaySetService.activeDisplaySets.forEach(activeDisplaySet => {
    _checkIfCanAddMeasurementsToDisplaySet(
      displaySet,
      activeDisplaySet,
      dataSource
    );
  });

  // Subscribe to new displaySets as the source may come in after.
  DisplaySetService.subscribe(
    DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
    data => {
      const { displaySetsAdded } = data;
      // If there are still some measurements that have not yet been loaded into cornerstone,
      // See if we can load them onto any of the new displaySets.
      displaySetsAdded.forEach(newDisplaySet => {
        _checkIfCanAddMeasurementsToDisplaySet(
          displaySet,
          newDisplaySet,
          dataSource
        );
      });
    }
  );
}

function _checkIfCanAddMeasurementsToDisplaySet(
  srDisplaySet,
  newDisplaySet,
  dataSource
) {
  let unloadedMeasurements = srDisplaySet.measurements.filter(
    measurement => measurement.loaded === false
  );

  if (unloadedMeasurements.length === 0) {
    // All already loaded!
    return;
  }

  if (!newDisplaySet instanceof ImageSet) {
    // This also filters out _this_ displaySet, as it is not an ImageSet.
    return;
  }

  const { sopClassUids, images } = newDisplaySet;

  // Check if any have the newDisplaySet is the correct SOPClass.
  unloadedMeasurements = unloadedMeasurements.filter(measurement =>
    measurement.coords.some(coord =>
      sopClassUids.includes(coord.ReferencedSOPSequence.ReferencedSOPClassUID)
    )
  );

  if (unloadedMeasurements.length === 0) {
    // New displaySet isn't the correct SOPClass, so can't contain the referenced images.
    return;
  }

  const SOPInstanceUIDs = [];

  unloadedMeasurements.forEach(measurement => {
    const { coords } = measurement;

    coords.forEach(coord => {
      const SOPInstanceUID =
        coord.ReferencedSOPSequence.ReferencedSOPInstanceUID;

      if (!SOPInstanceUIDs.includes(SOPInstanceUID)) {
        SOPInstanceUIDs.push(SOPInstanceUID);
      }
    });
  });

  const imageIdsForDisplaySet = dataSource.getImageIdsForDisplaySet(
    newDisplaySet
  );

  for (const imageId of imageIdsForDisplaySet) {
    if (!unloadedMeasurements.length) {
      // All measurements loaded.
      return;
    }

    const { SOPInstanceUID, frameNumber } = metadataProvider.getUIDsFromImageID(
      imageId
    );

    if (SOPInstanceUIDs.includes(SOPInstanceUID)) {
      for (let j = unloadedMeasurements.length - 1; j >= 0; j--) {
        const measurement = unloadedMeasurements[j];
        if (
          _measurementReferencesSOPInstanceUID(
            measurement,
            SOPInstanceUID,
            frameNumber
          )
        ) {
          addMeasurement(
            measurement,
            imageId,
            newDisplaySet.displaySetInstanceUID
          );

          unloadedMeasurements.splice(j, 1);
        }
      }
    }
  }
}

function _measurementReferencesSOPInstanceUID(
  measurement,
  SOPInstanceUID,
  frameNumber
) {
  const { coords } = measurement;

  // NOTE: The ReferencedFrameNumber can be multiple values according to the DICOM
  //  Standard. But for now, we will support only one ReferenceFrameNumber.
  const ReferencedFrameNumber =
    (measurement.coords[0].ReferencedSOPSequence &&
      measurement.coords[0].ReferencedSOPSequence[0]?.ReferencedFrameNumber) ||
    1;

  if (frameNumber && Number(frameNumber) !== Number(ReferencedFrameNumber))
    return false;

  for (let j = 0; j < coords.length; j++) {
    const coord = coords[j];
    const { ReferencedSOPInstanceUID } = coord.ReferencedSOPSequence;

    if (ReferencedSOPInstanceUID === SOPInstanceUID) {
      return true;
    }
  }
}

function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(
      instances,
      servicesManager,
      extensionManager
    );
  };

  return [
    {
      name: SOPClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

function _getMeasurements(ImagingMeasurementReportContentSequence) {
  const ImagingMeasurements = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImagingMeasurements
  );

  const MeasurementGroups = _getSequenceAsArray(
    ImagingMeasurements.ContentSequence
  ).filter(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.MeasurementGroup
  );

  const mergedContentSequencesByTrackingUniqueIdentifiers = _getMergedContentSequencesByTrackingUniqueIdentifiers(
    MeasurementGroups
  );

  let measurements = [];

  Object.keys(mergedContentSequencesByTrackingUniqueIdentifiers).forEach(
    trackingUniqueIdentifier => {
      const mergedContentSequence =
        mergedContentSequencesByTrackingUniqueIdentifiers[
          trackingUniqueIdentifier
        ];

      const measurement = _processMeasurement(mergedContentSequence);

      if (measurement) {
        measurements.push(measurement);
      }
    }
  );

  return measurements;
}

function _getMergedContentSequencesByTrackingUniqueIdentifiers(
  MeasurementGroups
) {
  const mergedContentSequencesByTrackingUniqueIdentifiers = {};

  MeasurementGroups.forEach(MeasurementGroup => {
    const ContentSequence = _getSequenceAsArray(
      MeasurementGroup.ContentSequence
    );

    const TrackingUniqueIdentifierItem = ContentSequence.find(
      item =>
        item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.TrackingUniqueIdentifier
    );

    if (!TrackingUniqueIdentifierItem) {
      console.warn(
        'No Tracking Unique Identifier, skipping ambiguous measurement.'
      );
    }

    const trackingUniqueIdentifier = TrackingUniqueIdentifierItem.UID;

    if (
      mergedContentSequencesByTrackingUniqueIdentifiers[
        trackingUniqueIdentifier
      ] === undefined
    ) {
      // Add the full ContentSequence
      mergedContentSequencesByTrackingUniqueIdentifiers[
        trackingUniqueIdentifier
      ] = [...ContentSequence];
    } else {
      // Add the ContentSequence minus the tracking identifier, as we have this
      // Information in the merged ContentSequence anyway.
      ContentSequence.forEach(item => {
        if (
          item.ConceptNameCodeSequence.CodeValue !==
          CodeNameCodeSequenceValues.TrackingUniqueIdentifier
        ) {
          mergedContentSequencesByTrackingUniqueIdentifiers[
            trackingUniqueIdentifier
          ].push(item);
        }
      });
    }
  });

  return mergedContentSequencesByTrackingUniqueIdentifiers;
}

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

function _processTID1410Measurement(mergedContentSequence) {
  // Need to deal with TID 1410 style measurements, which will have a SCOORD or SCOORD3D at the top level,
  // And non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D

  const graphicItem = mergedContentSequence.find(
    group => group.ValueType === 'SCOORD'
  );

  const UIDREFContentItem = mergedContentSequence.find(
    group => group.ValueType === 'UIDREF'
  );

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  if (!graphicItem) {
    console.warn(
      `graphic ValueType ${graphicItem.ValueType} not currently supported, skipping annotation.`
    );
    return;
  }

  const NUMContentItems = mergedContentSequence.filter(
    group => group.ValueType === 'NUM'
  );

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
        _getLabelFromMeasuredValueSequence(
          ConceptNameCodeSequence,
          MeasuredValueSequence
        )
      );
    }
  });

  return measurement;
}

function _processNonGeometricallyDefinedMeasurement(mergedContentSequence) {
  const NUMContentItems = mergedContentSequence.filter(
    group => group.ValueType === 'NUM'
  );

  const UIDREFContentItem = mergedContentSequence.find(
    group => group.ValueType === 'UIDREF'
  );

  const TrackingIdentifierContentItem = mergedContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.TrackingIdentifier
  );

  const Finding = mergedContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.Finding
  );

  const FindingSites = mergedContentSequence.filter(
    item =>
      item.ConceptNameCodeSequence.CodingSchemeDesignator ===
        CodingSchemeDesignators.SRT &&
      item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.FindingSite
  );

  const measurement = {
    loaded: false,
    labels: [],
    coords: [],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  if (
    Finding &&
    CodingSchemeDesignators.CornerstoneCodeSchemes.includes(
      Finding.ConceptCodeSequence.CodingSchemeDesignator
    ) &&
    Finding.ConceptCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.CornerstoneFreeText
  ) {
    measurement.labels.push({
      label: CORNERSTONE_FREETEXT_CODE_VALUE,
      value: Finding.ConceptCodeSequence.CodeMeaning,
    });
  }

  // TODO -> Eventually hopefully support SNOMED or some proper code library, just free text for now.
  if (FindingSites.length) {
    const cornerstoneFreeTextFindingSite = FindingSites.find(
      FindingSite =>
        CodingSchemeDesignators.CornerstoneCodeSchemes.includes(
          FindingSite.ConceptCodeSequence.CodingSchemeDesignator
        ) &&
        FindingSite.ConceptCodeSequence.CodeValue ===
          CodeNameCodeSequenceValues.CornerstoneFreeText
    );

    if (cornerstoneFreeTextFindingSite) {
      measurement.labels.push({
        label: CORNERSTONE_FREETEXT_CODE_VALUE,
        value: cornerstoneFreeTextFindingSite.ConceptCodeSequence.CodeMeaning,
      });
    }
  }

  NUMContentItems.forEach(item => {
    const {
      ConceptNameCodeSequence,
      ContentSequence,
      MeasuredValueSequence,
    } = item;

    const { ValueType } = ContentSequence;

    if (!ValueType === 'SCOORD') {
      console.warn(
        `Graphic ${ValueType} not currently supported, skipping annotation.`
      );

      return;
    }

    const coords = _getCoordsFromSCOORDOrSCOORD3D(ContentSequence);

    if (coords) {
      measurement.coords.push(coords);
    }

    if (MeasuredValueSequence) {
      measurement.labels.push(
        _getLabelFromMeasuredValueSequence(
          ConceptNameCodeSequence,
          MeasuredValueSequence
        )
      );
    }
  });

  return measurement;
}

function _getCoordsFromSCOORDOrSCOORD3D(item) {
  const { ValueType, RelationshipType, GraphicType, GraphicData } = item;

  if (
    !(
      RelationshipType == RELATIONSHIP_TYPE.INFERRED_FROM ||
      RelationshipType == RELATIONSHIP_TYPE.CONTAINS
    )
  ) {
    console.warn(
      `Relationshiptype === ${RelationshipType}. Cannot deal with NON TID-1400 SCOORD group with RelationshipType !== "INFERRED FROM" or "CONTAINS"`
    );

    return;
  }

  const coords = { ValueType, GraphicType, GraphicData };

  // ContentSequence has length of 1 as RelationshipType === 'INFERRED FROM'
  if (ValueType === 'SCOORD') {
    const { ReferencedSOPSequence } = item.ContentSequence;

    coords.ReferencedSOPSequence = ReferencedSOPSequence;
  } else if (ValueType === 'SCOORD3D') {
    const { ReferencedFrameOfReferenceSequence } = item.ContentSequence;

    coords.ReferencedFrameOfReferenceSequence = ReferencedFrameOfReferenceSequence;
  }

  return coords;
}

function _getLabelFromMeasuredValueSequence(
  ConceptNameCodeSequence,
  MeasuredValueSequence
) {
  const { CodeMeaning } = ConceptNameCodeSequence;
  const { NumericValue, MeasurementUnitsCodeSequence } = MeasuredValueSequence;
  const { CodeValue } = MeasurementUnitsCodeSequence;

  const formatedNumericValue = NumericValue
    ? Number(NumericValue).toFixed(2)
    : '';

  return {
    label: CodeMeaning,
    value: `${formatedNumericValue} ${CodeValue}`,
  }; // E.g. Long Axis: 31.0 mm
}

function _getReferencedImagesList(ImagingMeasurementReportContentSequence) {
  const ImageLibrary = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibrary
  );

  const ImageLibraryGroup = _getSequenceAsArray(
    ImageLibrary.ContentSequence
  ).find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibraryGroup
  );

  const referencedImages = [];

  _getSequenceAsArray(ImageLibraryGroup.ContentSequence).forEach(item => {
    const { ReferencedSOPSequence } = item;

    if (item.hasOwnProperty('ReferencedSOPClassUID')) {
      const {
        ReferencedSOPClassUID,
        ReferencedSOPInstanceUID,
      } = ReferencedSOPSequence;

      referencedImages.push({
        ReferencedSOPClassUID,
        ReferencedSOPInstanceUID,
      });
    }
  });

  return referencedImages;
}

function _getSequenceAsArray(sequence) {
  return Array.isArray(sequence) ? sequence : [sequence];
}

export default getSopClassHandlerModule;
