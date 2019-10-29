import * as dcmjs from 'dcmjs';
import { getAllDisplaySets, getInstanceMetadata } from './srUtils';

const retrieveDataFromSR = Part10SRArrayBuffer => {
  const allDisplaySets = getAllDisplaySets();

  // Get the dicom data as an Object
  const dicomData = dcmjs.data.DicomMessage.readFile(Part10SRArrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  // Convert the SR into the kind of object the Measurements package is expecting
  return imagingMeasurementsToMeasurementData(dataset, allDisplaySets);
};

const imagingMeasurementsToMeasurementData = (dataset, displaySets) => {
  const { MeasurementReport } = dcmjs.adapters.Cornerstone;
  const storedMeasurementByToolType = MeasurementReport.generateToolState(
    dataset
  );
  const measurementData = {};
  let measurementNumber = 0;

  Object.keys(storedMeasurementByToolType).forEach(toolType => {
    const measurements = storedMeasurementByToolType[toolType];
    measurementData[toolType] = [];

    measurements.forEach(measurement => {
      const instanceMetadata = getInstanceMetadata(
        displaySets,
        measurement.sopInstanceUid
      );
      const study = instanceMetadata._study;
      const series = instanceMetadata._series;
      const imagePath = [
        study.studyInstanceUid,
        series.seriesInstanceUid,
        measurement.sopInstanceUid,
        measurement.frameIndex,
      ].join('_');

      const imageId = instanceMetadata.getImageId();
      if (!imageId) {
        return;
      }

      // TODO: We need the currentTimepointID set into the viewer
      const currentTimepointId = 'TimepointId';

      const toolData = Object.assign({}, measurement, {
        imageId,
        imagePath,
        seriesInstanceUid: series.seriesInstanceUid,
        studyInstanceUid: study.studyInstanceUid,
        patientId: study.patientId,
        measurementNumber: ++measurementNumber,
        timepointId: currentTimepointId,
        toolType,
        _id: imageId + measurementNumber,
      });

      measurementData[toolType].push(toolData);
    });
  });

  return measurementData;
};

export default retrieveDataFromSR;
