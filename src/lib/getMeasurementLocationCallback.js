import cornerstoneTools from 'cornerstone-tools';
import updateTableWithNewMeasurementData from './updateTableWithNewMeasurementData';

export default function getMeasurementLocationCallback(
  eventData,
  tool,
  options
) {
  const { toolType } = tool;
  const { element } = eventData;
  const doneCallback = updateTableWithNewMeasurementData;

  const ToolInstance = cornerstoneTools.getToolForElement(element, toolType);

  ToolInstance.configuration.getMeasurementLocationCallback(
    tool,
    eventData,
    doneCallback,
    options
  );
}
