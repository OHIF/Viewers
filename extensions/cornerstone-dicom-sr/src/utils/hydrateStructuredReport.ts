import { utilities, metaData } from '@cornerstonejs/core';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import getLabelFromDCMJSImportedToolData from './getLabelFromDCMJSImportedToolData';
import { adaptersSR } from '@cornerstonejs/adapters';
import { annotation as CsAnnotation } from '@cornerstonejs/tools';
const { locking } = CsAnnotation;

const { guid } = OHIF.utils;
const { MeasurementReport, CORNERSTONE_3D_TAG } = adaptersSR.Cornerstone3D;

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';

const supportedLegacyCornerstoneTags = ['cornerstoneTools@^4.0.0'];

const convertCode = (codingValues, code) => {
  if (!code || code.CodingSchemeDesignator === 'CORNERSTONEJS') {
    return;
  }
  const ref = `${code.CodingSchemeDesignator}:${code.CodeValue}`;
  const ret = { ...codingValues[ref], ref, ...code, text: code.CodeMeaning };
  return ret;
};

const convertSites = (codingValues, sites) => {
  if (!sites || !sites.length) {
    return;
  }
  const ret = [];
  // Do as a loop to convert away from Proxy instances
  for (let i = 0; i < sites.length; i++) {
    // Deal with irregular conversion from dcmjs
    const site = convertCode(codingValues, sites[i][0] || sites[i]);
    if (site) {
      ret.push(site);
    }
  }
  return (ret.length && ret) || undefined;
};

/**
 * Hydrates a structured report, for default viewports.
 *
 */
export default function hydrateStructuredReport(
  { servicesManager, extensionManager, appConfig }: withAppTypes,
  displaySetInstanceUID
) {
  const annotationManager = CsAnnotation.state.getAnnotationManager();
  const disableEditing = appConfig?.disableEditing;
  const dataSource = extensionManager.getActiveDataSource()[0];
  const { measurementService, displaySetService, customizationService } = servicesManager.services;

  const codingValues = customizationService.getCustomization('codingValues', {});
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  // TODO -> We should define a strict versioning somewhere.
  const mappings = measurementService.getSourceMappings(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  if (!mappings || !mappings.length) {
    throw new Error(
      `Attempting to hydrate measurements service when no mappings present. This shouldn't be reached.`
    );
  }

  const instance = DicomMetadataStore.getInstance(
    displaySet.StudyInstanceUID,
    displaySet.SeriesInstanceUID,
    displaySet.SOPInstanceUID
  );

  const sopInstanceUIDToImageId = {};
  const imageIdsForToolState = {};

  displaySet.measurements.forEach(measurement => {
    const { ReferencedSOPInstanceUID, imageId, frameNumber } = measurement;

    if (!sopInstanceUIDToImageId[ReferencedSOPInstanceUID]) {
      sopInstanceUIDToImageId[ReferencedSOPInstanceUID] = imageId;
      imageIdsForToolState[ReferencedSOPInstanceUID] = [];
    }
    if (!imageIdsForToolState[ReferencedSOPInstanceUID][frameNumber]) {
      imageIdsForToolState[ReferencedSOPInstanceUID][frameNumber] = imageId;
    }
  });

  const datasetToUse = _mapLegacyDataSet(instance);

  // Use dcmjs to generate toolState.
  let storedMeasurementByAnnotationType = MeasurementReport.generateToolState(
    datasetToUse,
    // NOTE: we need to pass in the imageIds to dcmjs since the we use them
    // for the imageToWorld transformation. The following assumes that the order
    // that measurements were added to the display set are the same order as
    // the measurementGroups in the instance.
    sopInstanceUIDToImageId,
    utilities.imageToWorldCoords,
    metaData
  );

  const onBeforeSRHydration =
    customizationService.getModeCustomization('onBeforeSRHydration')?.value;

  if (typeof onBeforeSRHydration === 'function') {
    storedMeasurementByAnnotationType = onBeforeSRHydration({
      storedMeasurementByAnnotationType,
      displaySet,
    });
  }

  // Filter what is found by DICOM SR to measurements we support.
  const mappingDefinitions = mappings.map(m => m.annotationType);
  const hydratableMeasurementsInSR = {};

  Object.keys(storedMeasurementByAnnotationType).forEach(key => {
    if (mappingDefinitions.includes(key)) {
      hydratableMeasurementsInSR[key] = storedMeasurementByAnnotationType[key];
    }
  });

  // Set the series touched as tracked.
  const imageIds = [];

  // TODO: notification if no hydratable?
  Object.keys(hydratableMeasurementsInSR).forEach(annotationType => {
    const toolDataForAnnotationType = hydratableMeasurementsInSR[annotationType];

    toolDataForAnnotationType.forEach(toolData => {
      // Add the measurement to toolState
      // dcmjs and Cornerstone3D has structural defect in supporting multi-frame
      // files, and looking up the imageId from sopInstanceUIDToImageId results
      // in the wrong value.
      const frameNumber = (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
      const imageId =
        imageIdsForToolState[toolData.sopInstanceUid][frameNumber] ||
        sopInstanceUIDToImageId[toolData.sopInstanceUid];

      if (!imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    });
  });

  let targetStudyInstanceUID;
  const SeriesInstanceUIDs = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const { SeriesInstanceUID, StudyInstanceUID } = metaData.get('instance', imageId);

    if (!SeriesInstanceUIDs.includes(SeriesInstanceUID)) {
      SeriesInstanceUIDs.push(SeriesInstanceUID);
    }

    if (!targetStudyInstanceUID) {
      targetStudyInstanceUID = StudyInstanceUID;
    } else if (targetStudyInstanceUID !== StudyInstanceUID) {
      console.warn('NO SUPPORT FOR SRs THAT HAVE MEASUREMENTS FROM MULTIPLE STUDIES.');
    }
  }

  Object.keys(hydratableMeasurementsInSR).forEach(annotationType => {
    const toolDataForAnnotationType = hydratableMeasurementsInSR[annotationType];

    toolDataForAnnotationType.forEach(toolData => {
      // Add the measurement to toolState
      // dcmjs and Cornerstone3D has structural defect in supporting multi-frame
      // files, and looking up the imageId from sopInstanceUIDToImageId results
      // in the wrong value.
      const frameNumber = (toolData.annotation.data && toolData.annotation.data.frameNumber) || 1;
      const imageId =
        imageIdsForToolState[toolData.sopInstanceUid][frameNumber] ||
        sopInstanceUIDToImageId[toolData.sopInstanceUid];

      toolData.uid = guid();

      const instance = metaData.get('instance', imageId);
      const {
        FrameOfReferenceUID,
        // SOPInstanceUID,
        // SeriesInstanceUID,
        // StudyInstanceUID,
      } = instance;

      const annotation = {
        annotationUID: toolData.annotation.annotationUID,
        data: toolData.annotation.data,
        metadata: {
          toolName: annotationType,
          referencedImageId: imageId,
          FrameOfReferenceUID,
        },
      };

      const source = measurementService.getSource(
        CORNERSTONE_3D_TOOLS_SOURCE_NAME,
        CORNERSTONE_3D_TOOLS_SOURCE_VERSION
      );
      annotation.data.label = getLabelFromDCMJSImportedToolData(toolData);
      annotation.data.finding = convertCode(codingValues, toolData.finding?.[0]);
      annotation.data.findingSites = convertSites(codingValues, toolData.findingSites);
      annotation.data.site = annotation.data.findingSites?.[0];

      const matchingMapping = mappings.find(m => m.annotationType === annotationType);

      const newAnnotationUID = measurementService.addRawMeasurement(
        source,
        annotationType,
        { annotation },
        matchingMapping.toMeasurementSchema,
        dataSource
      );

      if (disableEditing) {
        const addedAnnotation = annotationManager.getAnnotation(newAnnotationUID);
        locking.setAnnotationLocked(addedAnnotation, true);
      }

      if (!imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    });
  });

  displaySet.isHydrated = true;

  return {
    StudyInstanceUID: targetStudyInstanceUID,
    SeriesInstanceUIDs,
  };
}

function _mapLegacyDataSet(dataset) {
  const REPORT = 'Imaging Measurements';
  const GROUP = 'Measurement Group';
  const TRACKING_IDENTIFIER = 'Tracking Identifier';

  // Identify the Imaging Measurements
  const imagingMeasurementContent = toArray(dataset.ContentSequence).find(
    codeMeaningEquals(REPORT)
  );

  // Retrieve the Measurements themselves
  const measurementGroups = toArray(imagingMeasurementContent.ContentSequence).filter(
    codeMeaningEquals(GROUP)
  );

  // For each of the supported measurement types, compute the measurement data
  const measurementData = {};

  const cornerstoneToolClasses = MeasurementReport.CORNERSTONE_TOOL_CLASSES_BY_UTILITY_TYPE;

  const registeredToolClasses = [];

  Object.keys(cornerstoneToolClasses).forEach(key => {
    registeredToolClasses.push(cornerstoneToolClasses[key]);
    measurementData[key] = [];
  });

  measurementGroups.forEach((measurementGroup, index) => {
    const measurementGroupContentSequence = toArray(measurementGroup.ContentSequence);

    const TrackingIdentifierGroup = measurementGroupContentSequence.find(
      contentItem => contentItem.ConceptNameCodeSequence.CodeMeaning === TRACKING_IDENTIFIER
    );

    const TrackingIdentifier = TrackingIdentifierGroup.TextValue;

    let [cornerstoneTag, toolName] = TrackingIdentifier.split(':');
    if (supportedLegacyCornerstoneTags.includes(cornerstoneTag)) {
      cornerstoneTag = CORNERSTONE_3D_TAG;
    }

    const mappedTrackingIdentifier = `${cornerstoneTag}:${toolName}`;

    TrackingIdentifierGroup.TextValue = mappedTrackingIdentifier;
  });

  return dataset;
}

const toArray = function (x) {
  return Array.isArray(x) ? x : [x];
};

const codeMeaningEquals = codeMeaningName => {
  return contentItem => {
    return contentItem.ConceptNameCodeSequence.CodeMeaning === codeMeaningName;
  };
};
