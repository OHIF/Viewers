import cornerstoneTools from 'cornerstone-tools';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import getLabelFromDCMJSImportedToolData from './utils/getLabelFromDCMJSImportedToolData';
import getCornerstoneToolStateToMeasurementSchema from './getCornerstoneToolStateToMeasurementSchema';
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
  const dataSource = extensionManager.getActiveDataSource()[0];
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

      const instance = cornerstone.metaData.get('instance', imageId);
      const {
        SOPInstanceUID,
        FrameOfReferenceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
      } = instance;

      // Let the measurement service know we added to toolState
      const toMeasurementSchema = getCornerstoneToolStateToMeasurementSchema(
        toolType,
        MeasurementService,
        DisplaySetService,
        SOPInstanceUID,
        FrameOfReferenceUID,
        SeriesInstanceUID,
        StudyInstanceUID
      );

      const source = MeasurementService.getSource('CornerstoneTools', '4');

      data.label = getLabelFromDCMJSImportedToolData(data);

      MeasurementService.addRawMeasurement(
        source,
        toolType,
        data,
        toMeasurementSchema,
        dataSource
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
