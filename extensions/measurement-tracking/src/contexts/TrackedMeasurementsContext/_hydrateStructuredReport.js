import cornerstoneTools from 'cornerstone-tools';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import getLabelFromDCMJSImportedToolData from './utils/getLabelFromDCMJSImportedToolData';
import getToolStateToCornerstoneMeasurementSchema from './getToolStateToCornerstoneMeasurementSchema';
import { adapters } from 'dcmjs';

const { guid } = OHIF.utils;
const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 *
 */
export default function _hydrateStructuredReport(
  { servicesManager, extensionManager },
  displaySetInstanceUID
) {
  const { MeasurementService, DisplaySetService } = servicesManager.services;

  const displaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

  // TODO -> We should define a strict versioning somewhere.
  const mappings = MeasurementService.getSourceMappings(
    'CornerstoneTools',
    '4'
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

  const { MeasurementReport } = adapters.Cornerstone;

  const sopInstanceUIDToImageId = {};

  displaySet.measurements.forEach(measurement => {
    const { ReferencedSOPInstanceUID, imageId } = measurement;
    if (!sopInstanceUIDToImageId[ReferencedSOPInstanceUID]) {
      sopInstanceUIDToImageId[ReferencedSOPInstanceUID] = imageId;
    }
  });

  // Use dcmjs to generate toolState.
  const storedMeasurementByToolType = MeasurementReport.generateToolState(
    instance
  );

  // Filter what is found by DICOM SR to measurements we support.
  const mappingDefinitions = mappings.map(m => m.definition);
  const hydratableMeasurementsInSR = {};

  Object.keys(storedMeasurementByToolType).forEach(key => {
    if (mappingDefinitions.includes(key)) {
      hydratableMeasurementsInSR[key] = storedMeasurementByToolType[key];
    }
  });

  // Set the series touched as tracked.
  const imageIds = [];

  // TODO: notification if no hydratable?
  Object.keys(hydratableMeasurementsInSR).forEach(toolType => {
    const toolDataForToolType = hydratableMeasurementsInSR[toolType];

    toolDataForToolType.forEach(data => {
      // Add the measurement to toolState
      const imageId = sopInstanceUIDToImageId[data.sopInstanceUid];

      if (!imageIds.includes(imageId)) {
        imageIds.push(imageId);
      }
    });
  });

  let targetStudyInstanceUID;
  const SeriesInstanceUIDs = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const { SeriesInstanceUID, StudyInstanceUID } = cornerstone.metaData.get(
      'instance',
      imageId
    );

    if (!SeriesInstanceUIDs.includes(SeriesInstanceUID)) {
      SeriesInstanceUIDs.push(SeriesInstanceUID);
    }

    if (!targetStudyInstanceUID) {
      targetStudyInstanceUID = StudyInstanceUID;
    } else if (targetStudyInstanceUID !== StudyInstanceUID) {
      console.warn(
        'NO SUPPORT FOR SRs THAT HAVE MEASUREMENTS FROM MULTIPLE STUDIES.'
      );
    }
  }

  Object.keys(hydratableMeasurementsInSR).forEach(toolType => {
    const toolDataForToolType = hydratableMeasurementsInSR[toolType];

    toolDataForToolType.forEach(data => {
      // Add the measurement to toolState
      const imageId = sopInstanceUIDToImageId[data.sopInstanceUid];

      data.id = guid();

      _addToolDataToCornerstoneTools(data, toolType, imageId);

      // Let the measurement service know we added to toolState
      const toMeasurementSchema = getToolStateToCornerstoneMeasurementSchema(
        toolType,
        MeasurementService,
        DisplaySetService,
        imageId
      );

      const source = MeasurementService.getSource('CornerstoneTools', '4');

      data.label = getLabelFromDCMJSImportedToolData(data);

      MeasurementService.addRawMeasurement(
        source,
        toolType,
        data,
        toMeasurementSchema
      );

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

function _addToolDataToCornerstoneTools(data, toolType, imageId) {
  const toolState = globalImageIdSpecificToolStateManager.saveToolState();

  if (toolState[imageId] === undefined) {
    toolState[imageId] = {};
  }

  const imageIdToolState = toolState[imageId];

  // If we don't have tool state for this type of tool, add an empty object
  if (imageIdToolState[toolType] === undefined) {
    imageIdToolState[toolType] = {
      data: [],
    };
  }

  const toolData = imageIdToolState[toolType];

  toolData.data.push(data);
}
