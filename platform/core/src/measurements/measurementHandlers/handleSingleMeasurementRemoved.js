import cornerstone from 'cornerstone-core';
import { MeasurementApi } from '../classes';
import log from '../../log';
import refreshCornerstoneViewports from '../lib/refreshCornerstoneViewports';

export default function handleSingleMeasurementRemoved({
  eventData,
  tool,
  toolGroupId,
  toolGroup,
}) {
  log.info('CornerstoneToolsMeasurementRemoved');
  const { measurementData, toolType } = eventData;

  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const collection = measurementApi.tools[toolType];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  const measurementTypeId = measurementApi.toolsGroupsMap[toolType];
  const measurement = collection.find(t => t._id === measurementData._id);

  // Stop here if the measurement is already gone or never existed
  if (!measurement) return;

  // Remove all the measurements with the given type and number
  const { lesionNamingNumber, timepointId } = measurement;
  measurementApi.deleteMeasurements(toolType, measurementTypeId, {
    lesionNamingNumber,
    timepointId,
  });

  // TODO: This is very hacky, but will work for now
  refreshCornerstoneViewports();

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
