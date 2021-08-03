import cornerstone from 'cornerstone-core';
import { MeasurementApi } from '../classes';
import log from '../../log';
import refreshCornerstoneViewports from '../lib/refreshCornerstoneViewports';

export default function({ eventData, tool, toolGroupId, toolGroup }) {
  log.info('CornerstoneToolsMeasurementRemoved');
  const { measurementData } = eventData;

  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const collection = measurementApi.tools[tool.parentTool];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  const measurementIndex = collection.findIndex(
    t => t._id === measurementData._id
  );
  const measurement =
    measurementIndex > -1 ? collection[measurementIndex] : null;

  // Stop here if the measurement is already gone or never existed
  if (!measurement) return;

  if (measurement.childToolsCount === 1) {
    // Remove the measurement
    collection.splice(measurementIndex, 1);
    measurementApi.onMeasurementRemoved(tool.parentTool, measurement);
  } else {
    // Update the measurement
    measurement[tool.attribute] = null;
    measurement.childToolsCount = (measurement.childToolsCount || 0) - 1;
    measurementApi.updateMeasurement(tool.parentTool, measurement);
  }

  // TODO: This is very hacky, but will work for now
  refreshCornerstoneViewports();

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
