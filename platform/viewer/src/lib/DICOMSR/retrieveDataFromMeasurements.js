import * as dcmjs from 'dcmjs';
import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';

const retrieveDataFromMeasurements = measurements => {
  const cornerstoneAdpater = dcmjs.adapters.Cornerstone;
  const { MeasurementReport } = cornerstoneAdpater;
  const { getImageIdForImagePath } = OHIF.measurements;

  const toolState = {};

  Object.keys(measurements).forEach(measurementType => {
    const annotations = measurements[measurementType];

    annotations.forEach(annotation => {
      const { toolType, imagePath } = annotation;
      if (cornerstoneAdpater[toolType]) {
        const imageId = getImageIdForImagePath(imagePath);
        toolState[imageId] = toolState[imageId] || {};
        toolState[imageId][toolType] = toolState[imageId][toolType] || {
          data: [],
        };

        toolState[imageId][toolType].data.push(annotation);
      } else {
        OHIF.log.warn(`[DICOMSR] Tool type not supported: ${toolType}`);
      }
    });
  });

  try {
    const report = MeasurementReport.generateReport(
      toolState,
      cornerstone.metaData
    );
    return report.dataset;
  } catch (error) {
    throw error;
  }
};

export default retrieveDataFromMeasurements;
