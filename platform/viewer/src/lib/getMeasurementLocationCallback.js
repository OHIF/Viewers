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

  if (
    !ToolInstance ||
    !ToolInstance.configuration ||
    !ToolInstance.configuration.getMeasurementLocationCallback
  ) {
    console.warn(
      'Tool instance configuration is missing: getMeasurementLocationCallback'
    );

    return;
  }

  ToolInstance.configuration.getMeasurementLocationCallback(
    tool,
    eventData,
    doneCallback,
    options
  );
}
