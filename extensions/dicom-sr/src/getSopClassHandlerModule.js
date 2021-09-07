import { utils, classes } from '@ohif/core';

/** Internal imports */
import addMeasurement from './utils/addMeasurement';
import isRehydratable from './utils/isRehydratable';
import { SOPClassHandlerName, SOPClassHandlerId } from './id';

const { ImageSet } = classes;

// TODO ->
// Add SR thumbnail
// Make viewport
// Get stacks from referenced displayInstanceUID and load into wrapped CornerStone viewport.

const sopClassUids = [
  '1.2.840.10008.5.1.4.1.1.88.11', // BASIC_TEXT_SR
  '1.2.840.10008.5.1.4.1.1.88.22', // ENHANCED_SR
  '1.2.840.10008.5.1.4.1.1.88.33', // COMPREHENSIVE_SR
  '1.2.840.10008.5.1.4.1.1.88.34', // COMPREHENSIVE_3D_SR
];

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
  CornerstoneFreeText: 'CORNERSTONEFREETEXT', // CST4
  Score: '246262008',
};

const CodingSchemeDesignators = {
  SRT: 'SRT',
  cornerstoneTools4: 'CST4',
};

const RELATIONSHIP_TYPE = {
  INFERRED_FROM: 'INFERRED FROM',
  SELECTED_FROM: 'SELECTED FROM',
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
  displaySet.measurements = _getMeasurements(ContentSequence, displaySet);

  const mappings = MeasurementService.getSourceMappings(
    'CornerstoneTools',
    '4'
  );

  displaySet.isHydrated = false;
  displaySet.isRehydratable = isRehydratable(displaySet, mappings);
  displaySet.isLoaded = true;

  /**
   * Handler that publishes event to notify that
   * this display set has fully loaded.
   */
  const onMeasurementsLoadedHandler = () => {
    DisplaySetService.publish(DisplaySetService.EVENTS.DISPLAY_SET_LOADED, {
      displaySet,
    });
  };

  // Check currently added displaySets and add measurements if the sources exist.
  DisplaySetService.activeDisplaySets.forEach(activeDisplaySet => {
    _checkIfCanAddMeasurementsToDisplaySet(
      displaySet,
      activeDisplaySet,
      dataSource,
      onMeasurementsLoadedHandler
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
          dataSource,
          onMeasurementsLoadedHandler
        );
      });
    }
  );

  return displaySet;
}

function _checkIfCanAddMeasurementsToDisplaySet(
  srDisplaySet,
  newDisplaySet,
  dataSource,
  onDone
) {
  let measurements = srDisplaySet.measurements;

  /**
   * Look for image sets.
   * This also filters out _this_ displaySet, as it is not an image set.
   */
  if (!newDisplaySet instanceof ImageSet) {
    return;
  }

  const { sopClassUids, images } = newDisplaySet;

  /**
   * Filter measurements that references the correct sop class.
   */
  measurements = measurements.filter(measurement => {
    return measurement.coords.some(coord => {
      return sopClassUids.includes(
        coord.ReferencedSOPSequence.ReferencedSOPClassUID
      );
    });
  });

  /**
   * New display set doesn't have measurements that references the correct sop class.
   */
  if (measurements.length === 0) {
    return;
  }

  const imageIds = dataSource.getImageIdsForDisplaySet(newDisplaySet);
  const SOPInstanceUIDs = images.map(i => i.SOPInstanceUID);

  measurements.forEach(measurement => {
    const { coords } = measurement;

    coords.forEach(coord => {
      const imageIndex = SOPInstanceUIDs.findIndex(
        SOPInstanceUID =>
          SOPInstanceUID ===
          coord.ReferencedSOPSequence.ReferencedSOPInstanceUID
      );
      if (imageIndex > -1) {
        const imageId = imageIds[imageIndex];
        addMeasurement(
          measurement,
          imageId,
          newDisplaySet.displaySetInstanceUID
        );
      }
    });
  });

  onDone();
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

function _getMeasurements(ImagingMeasurementReportContentSequence, displaySet) {
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

      const measurement = _processMeasurement(
        mergedContentSequence,
        displaySet
      );

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

function _processMeasurement(mergedContentSequence, displaySet) {
  if (
    mergedContentSequence.some(
      group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
    )
  ) {
    return _processTID1410Measurement(mergedContentSequence, displaySet);
  }

  return _processNonGeometricallyDefinedMeasurement(mergedContentSequence);
}

/**
 * TID 1410 Planar ROI Measurements and Qualitative Evaluations.
 *
 * @param {*} mergedContentSequence
 * @returns
 */
function _processTID1410Measurement(mergedContentSequence, displaySet) {
  // Need to deal with TID 1410 style measurements, which will have a SCOORD or SCOORD3D at the top level,
  // And non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D
  // TODO -> Look at RelationshipType => Contains means

  const graphicItem = mergedContentSequence.find(
    group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
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
    coords: [_getCoordsFromSCOORDOrSCOORD3D(graphicItem, displaySet)],
    TrackingUniqueIdentifier: UIDREFContentItem.UID,
    TrackingIdentifier: TrackingIdentifierContentItem.TextValue,
  };

  NUMContentItems.forEach(item => {
    const {
      ConceptNameCodeSequence,
      ContentSequence,
      MeasuredValueSequence,
    } = item;

    if (
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.Score
    ) {
      ContentSequence.forEach(item => {
        if (
          [
            RELATIONSHIP_TYPE.SELECTED_FROM,
            RELATIONSHIP_TYPE.INFERRED_FROM,
          ].includes(item.RelationshipType)
        ) {
          if (item.ReferencedSOPSequence) {
            measurement.coords.forEach(coord => {
              coord.ReferencedSOPSequence = item.ReferencedSOPSequence;
            });
          }
        }
      });
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
    Finding.ConceptCodeSequence.CodingSchemeDesignator ===
      CodingSchemeDesignators.cornerstoneTools4 &&
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
        FindingSite.ConceptCodeSequence.CodingSchemeDesignator ===
          CodingSchemeDesignators.cornerstoneTools4 &&
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

    if (!ValueType === 'SCOORD' && !ValueType === 'SCOORD3D') {
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

function _getCoordsFromSCOORDOrSCOORD3D(graphicItem, displaySet) {
  const { ValueType, RelationshipType, GraphicType, GraphicData } = graphicItem;

  // if (RelationshipType !== RELATIONSHIP_TYPE.INFERRED_FROM) {
  //   console.warn(
  //     `Relationshiptype === ${RelationshipType}. Cannot deal with NON TID-1400 SCOORD group with RelationshipType !== "INFERRED FROM."`
  //   );
  //   return;
  // }

  const coords = { ValueType, GraphicType, GraphicData };

  // ContentSequence has length of 1 as RelationshipType === 'INFERRED FROM'
  if (ValueType === 'SCOORD') {
    const { ReferencedSOPSequence } = graphicItem.ContentSequence;
    coords.ReferencedSOPSequence = ReferencedSOPSequence;
  } else if (ValueType === 'SCOORD3D') {
    if (graphicItem.ReferencedFrameOfReferenceUID) {
      // todo
    }

    if (graphicItem.ContentSequence) {
      const {
        ReferencedFrameOfReferenceSequence,
      } = graphicItem.ContentSequence;
      coords.ReferencedFrameOfReferenceSequence = ReferencedFrameOfReferenceSequence;
    }
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
    ? Number(NumericValue).toFixed(1)
    : '';

  return {
    label: CodeMeaning,
    value: `${formatedNumericValue} ${CodeValue}`,
  }; // E.g. Long Axis: 31.0 mm
}

function _getReferencedImagesList(ImagingMeasurementReportContentSequence) {
  const referencedImages = [];

  const ImageLibrary = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibrary
  );

  if (!ImageLibrary.ContentSequence) {
    return referencedImages;
  }

  const ImageLibraryGroup = _getSequenceAsArray(
    ImageLibrary.ContentSequence
  ).find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibraryGroup
  );

  _getSequenceAsArray(ImageLibraryGroup.ContentSequence).forEach(item => {
    const { ReferencedSOPSequence } = item;
    const {
      ReferencedSOPClassUID,
      ReferencedSOPInstanceUID,
    } = ReferencedSOPSequence;

    referencedImages.push({ ReferencedSOPClassUID, ReferencedSOPInstanceUID });
  });

  return referencedImages;
}

function _getSequenceAsArray(sequence) {
  return Array.isArray(sequence) ? sequence : [sequence];
}

export default getSopClassHandlerModule;
