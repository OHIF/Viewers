import cornerstone from 'cornerstone-core';
import { MeasurementApi } from '../classes';
import log from '../../log';
import user from '../../user';
import getImageAttributes from '../lib/getImageAttributes';
import getLabel from '../lib/getLabel';
import refreshCornerstoneViewports from '../lib/refreshCornerstoneViewports';

export default function handleSingleMeasurementAdded({ eventData, tool }) {
  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const { measurementData, toolType } = eventData;

  const collection = measurementApi.tools[toolType];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  // Stop here if there's no measurement data or if it was cancelled
  if (!measurementData || measurementData.cancelled) return;

  log.info('CornerstoneToolsMeasurementAdded');

  const imageAttributes = getImageAttributes(eventData.element);
  const measurement = Object.assign({}, measurementData, imageAttributes, {
    lesionNamingNumber: measurementData.lesionNamingNumber,
    userId: user.getUserId(),
    toolType,
  });

  const addedMeasurement = measurementApi.addMeasurement(toolType, measurement);
  Object.assign(measurementData, addedMeasurement);

  const measurementLabel = getLabel(measurementData);
  if (measurementLabel) {
    measurementData.labels = [measurementLabel];
  }

  // TODO: This is very hacky, but will work for now
  refreshCornerstoneViewports();

  // TODO: Notify about the last activated measurement

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
