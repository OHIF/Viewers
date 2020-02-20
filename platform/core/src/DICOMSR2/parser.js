import * as dcmjs from 'dcmjs';
import { utils } from '@ohif/core';
import cornerstone from 'cornerstone-core';

const { studyMetadataManager } = utils;
const { MeasurementReport } = dcmjs.adapters.OHIF;

const _isToolSupported = toolType => {
  return ['Length', 'Bidirectional'].includes(toolType);
};

const _getImageId = ({
  studyInstanceUID,
  referenceSeriesUID,
  sopInstanceUID,
  frameNumber,
}) => {
  const studyMetadata = studyMetadataManager.get(studyInstanceUID);
  const series = studyMetadata.getSeriesByUID(referenceSeriesUID);
  const instance = series.getInstanceByUID(sopInstanceUID);
  return instance.getImageId(frameNumber);
};

const _withImageId = measurements => {
  return measurements.map(measurement => {
    return {
      ...measurement,
      imageId: _getImageId(measurement)
    };
  });
};

/**
 * Function to parse measurement service measurements to dcmjs format
 *
 * @param {Object} measurements Measuremet service measurements
 * @returns {Object} dcmjs measurement report
 */
const toDCMJS = measurements => {
  const measurementsWithImageId = _withImageId(measurements);
  const report = MeasurementReport.generateReport(measurementsWithImageId, cornerstone.metaData);
  report.dataset;
};


/**
 * Function to parse the part10 array buffer that comes from a
 * DICOM Structured report into measurement service measurement format
 *
 * @param {ArrayBuffer} part10SRArrayBuffer
 * @param {Array} displaySets
 * @returns
 */
const toMeasurementService = (part10SRArrayBuffer, displaySets) => {
  const dicomData = dcmjs.data.DicomMessage.readFile(part10SRArrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

  const storedMeasurementByImage = MeasurementReport.getMeasurementGroup(dataset);

  /* const measurementData = {};
  let measurementNumber = 0;

  Object.keys(storedMeasurementByToolType).forEach(toolName => {
    const measurements = storedMeasurementByToolType[toolName];
    measurementData[toolName] = [];

    measurements.forEach(measurement => {
      const instanceMetadata = findInstanceMetadataBySopInstanceUid(
        displaySets,
        measurement.sopInstanceUid
      );
      const { _study: study, _series: series } = instanceMetadata;
      const { studyInstanceUid, patientId } = study;
      const { seriesInstanceUid } = series;
      const { sopInstanceUid, frameIndex } = measurement;
      const imagePath = getImagePath(
        studyInstanceUid,
        seriesInstanceUid,
        sopInstanceUid,
        frameIndex
      );

      const imageId = instanceMetadata.getImageId();
      if (!imageId) {
        return;
      }

      // TODO: We need the currentTimepointID set into the viewer
      const currentTimepointId = 'TimepointId';

      const toolData = Object.assign({}, measurement, {
        imageId,
        imagePath,
        seriesInstanceUid,
        studyInstanceUid,
        patientId,
        measurementNumber: ++measurementNumber,
        timepointId: currentTimepointId,
        toolType: toolName,
        _id: imageId + measurementNumber,
      });

      measurementData[toolName].push(toolData);
    });
  });

  return measurementData; */
};

export default {
  toDCMJS,
  toMeasurementService
};
