import cornerstone from 'cornerstone-core';
import { MeasurementApi } from '../classes';
import log from '../../log';

export default function({ eventData, tool, toolGroupId, toolGroup }) {
  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const { measurementData } = eventData;

  const collection = measurementApi.tools[tool.parentTool];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  log.info('CornerstoneToolsMeasurementModified');

  const measurement = collection.find(t => t._id === measurementData._id);
  let childMeasurement = measurement && measurement[tool.attribute];

  // Stop here if the measurement is already deleted
  if (!childMeasurement) return;

  childMeasurement = Object.assign(childMeasurement, measurementData);
  childMeasurement.viewport = cornerstone.getViewport(eventData.element);

  // Update the parent measurement
  measurement[tool.attribute] = childMeasurement;
  measurementApi.updateMeasurement(tool.parentTool, measurement);

  // TODO: Notify about the last activated measurement

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
