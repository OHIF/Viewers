import * as dcmjs from 'dcmjs';
import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';

const retrieveDataFromMeasurements = measurements => {
  const cornerstoneAdpater = dcmjs.adapters.Cornerstone;
  const { MeasurementReport } = cornerstoneAdpater;
  const { getImageIdForImagePath } = OHIF.measurements;

  const toolState = {};
  const notSupportedTools = [];

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
        notSupportedTools.push(toolType);
      }
    });
  });

  if (notSupportedTools.length > 0) {
    OHIF.log.warn(
      `[DICOMSR] Tooltypes not supported: ${notSupportedTools.join(', ')}`
    );
  }

  try {
    const report = MeasurementReport.generateReport(
      toolState,
      cornerstone.metaData
    );
    return {
      dataset: report.dataset,
      notSupportedTools,
    };
  } catch (error) {
    throw error;
  }
};

export default retrieveDataFromMeasurements;
