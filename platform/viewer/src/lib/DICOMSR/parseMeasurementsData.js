import * as dcmjs from 'dcmjs';
import { log, measurements } from '@ohif/core';
import cornerstone from 'cornerstone-core';
import isToolSupported from './utils/isToolSupported';

/**
 *
 *
 * @param {Object} measurementsData
 * @returns
 */
const parseMeasurementsData = measurementsData => {
  const { MeasurementReport } = dcmjs.adapters.Cornerstone;
  const { getImageIdForImagePath } = measurements;

  const toolState = {};
  const unsupportedTools = [];

  Object.keys(measurementsData).forEach(measurementType => {
    const annotations = measurementsData[measurementType];

    annotations.forEach(annotation => {
      const { toolType, imagePath } = annotation;

      if (isToolSupported(toolType)) {
        const imageId = getImageIdForImagePath(imagePath);
        toolState[imageId] = toolState[imageId] || {};
        toolState[imageId][toolType] = toolState[imageId][toolType] || {
          data: [],
        };

        toolState[imageId][toolType].data.push(annotation);
      } else {
        unsupportedTools.push(toolType);
      }
    });
  });

  if (unsupportedTools.length > 0) {
    log.warn(
      `[DICOMSR] Tooltypes not supported: ${unsupportedTools.join(', ')}`
    );
  }

  const report = MeasurementReport.generateReport(
    toolState,
    cornerstone.metaData
  );
  return {
    dataset: report.dataset,
    unsupportedTools,
  };
};

export default parseMeasurementsData;
