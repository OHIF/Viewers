import dcmjs from 'dcmjs';
import classes from '../classes';
import parseSCOORD3D from './SCOORD3D/parseSCOORD3D';

import findInstanceMetadataBySopInstanceUID from './utils/findInstanceMetadataBySopInstanceUid';

const { LogManager } = classes;

/**
 * Function to parse the part10 array buffer that comes from a DICOM Structured report into measurementData
 * measurementData format is a viewer specific format to be stored into the redux and consumed by other components
 * (e.g. measurement table)
 *
 * @param {ArrayBuffer} part10SRArrayBuffer
 * @param {Array} displaySets
 * @param {object} external
 * @returns
 */
const parseDicomStructuredReport = (
  part10SRArrayBuffer,
  displaySets,
  external
) => {
  if (external && external.servicesManager) {
    parseSCOORD3D({ servicesManager: external.servicesManager, displaySets });
  }

  // Get the dicom data as an Object
  const dicomData = dcmjs.data.DicomMessage.readFile(part10SRArrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  const { MeasurementReport } = dcmjs.adapters.Cornerstone;

  let storedMeasurementByToolType;
  try {
    storedMeasurementByToolType = MeasurementReport.generateToolState(dataset);
  } catch (error) {
    const seriesDescription = dataset.SeriesDescription || '';
    LogManager.publish(LogManager.EVENTS.OnLog, {
      title: `Failed to parse ${seriesDescription} measurement report`,
      type: 'warning',
      message: error.message || '',
      notify: true,
    });
    return;
  }

  const measurementData = {};
  let measurementNumber = 0;

  Object.keys(storedMeasurementByToolType).forEach(toolName => {
    const measurements = storedMeasurementByToolType[toolName];
    measurementData[toolName] = [];

    measurements.forEach(measurement => {
      const instanceMetadata = findInstanceMetadataBySopInstanceUID(
        displaySets,
        measurement.sopInstanceUid
      );

      const { _study: study, _series: series } = instanceMetadata;
      const { StudyInstanceUID, PatientID } = study;
      const { SeriesInstanceUID } = series;
      const { sopInstanceUid, frameIndex } = measurement;
      const imagePath = getImagePath(
        StudyInstanceUID,
        SeriesInstanceUID,
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
        SOPInstanceUID: sopInstanceUid,
        SeriesInstanceUID,
        StudyInstanceUID,
        PatientID,
        measurementNumber: ++measurementNumber,
        timepointId: currentTimepointId,
        toolType: toolName,
        _id: imageId + measurementNumber,
      });

      measurementData[toolName].push(toolData);
    });
  });

  return measurementData;
};

/**
 * Function to create imagePath with all imageData related
 * @param {string} StudyInstanceUID
 * @param {string} SeriesInstanceUID
 * @param {string} SOPInstanceUID
 * @param {string} frameIndex
 * @returns
 */
const getImagePath = (
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID,
  frameIndex
) => {
  return [StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, frameIndex].join(
    '_'
  );
};

export default parseDicomStructuredReport;
