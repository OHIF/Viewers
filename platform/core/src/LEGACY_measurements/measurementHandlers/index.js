import { MeasurementApi } from '../classes';
import handleSingleMeasurementAdded from './handleSingleMeasurementAdded';
import handleChildMeasurementAdded from './handleChildMeasurementAdded';
import handleSingleMeasurementModified from './handleSingleMeasurementModified';
import handleChildMeasurementModified from './handleChildMeasurementModified';
import handleSingleMeasurementRemoved from './handleSingleMeasurementRemoved';
import handleChildMeasurementRemoved from './handleChildMeasurementRemoved';

const getEventData = event => {
  const eventData = event.detail;
  if (eventData.toolName) {
    eventData.toolType = eventData.toolName;
  }

  return eventData;
};

const MeasurementHandlers = {
  handleSingleMeasurementAdded,
  handleChildMeasurementAdded,
  handleSingleMeasurementModified,
  handleChildMeasurementModified,
  handleSingleMeasurementRemoved,
  handleChildMeasurementRemoved,

  onAdded(event) {
    const eventData = getEventData(event);
    const { toolType } = eventData;
    const {
      toolGroupId,
      toolGroup,
      tool,
    } = MeasurementApi.getToolConfiguration(toolType);
    const params = {
      eventData,
      tool,
      toolGroupId,
      toolGroup,
    };

    if (!tool) return;

    if (tool.parentTool) {
      handleChildMeasurementAdded(params);
    } else {
      handleSingleMeasurementAdded(params);
    }
  },

  onModified(event) {
    const eventData = getEventData(event);
    const { toolType } = eventData;
    const {
      toolGroupId,
      toolGroup,
      tool,
    } = MeasurementApi.getToolConfiguration(toolType);
    const params = {
      eventData,
      tool,
      toolGroupId,
      toolGroup,
    };

    if (!tool) return;

    if (tool.parentTool) {
      handleChildMeasurementModified(params);
    } else {
      handleSingleMeasurementModified(params);
    }
  },

  onRemoved(event) {
    const eventData = getEventData(event);
    const { toolType } = eventData;
    const {
      toolGroupId,
      toolGroup,
      tool,
    } = MeasurementApi.getToolConfiguration(toolType);
    const params = {
      eventData,
      tool,
      toolGroupId,
      toolGroup,
    };

    if (!tool) return;

    if (tool.parentTool) {
      handleChildMeasurementRemoved(params);
    } else {
      handleSingleMeasurementRemoved(params);
    }
  },
};

export default MeasurementHandlers;
