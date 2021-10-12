import { getEnabledElement } from '../state';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const TriggerAlgorithm = ({ viewports, servicesManager }) => {
  // pass all the data here and configure them
  const { UINotificationService } = servicesManager.services;

  // setting active viewport reference to element variable
  const element = getEnabledElement(viewports.activeViewportIndex);
  if (!element) {
    return;
  }

  const enabled_element = cornerstone.getEnabledElement(element);
  if (!enabled_element || !enabled_element.image) {
    return;
  }

  const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');
  const stack = tool_data;

  // Add our tool, and set it's mode
  if (!stack) {
    cornerstoneTools.setToolActive('RectangleRoi', {
      mouseButtonMask: 1,
    });
  }
  // Pull event from cornerstone-tools
  const { EVENTS } = cornerstoneTools;

  // Adding event listener to checking when user is done deriving a measurement
  element.addEventListener(EVENTS.MEASUREMENT_COMPLETED, function(e) {
    const event_data = e.detail;
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');

    if (tool_data.data.length > 0) {
      cornerstoneTools.clearToolState(element, 'RectangleRoi');

      cornerstone.updateImage(element);

      cornerstoneTools.addToolState(
        element,
        'RectangleRoi',
        event_data.measurementData
      );
    }
  });

  // adding event listener for when user starts to get new dimensions
  element.addEventListener(EVENTS.MEASUREMENT_ADDED, () => {
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');

    console.log({ tool_data });

    // const state_stack_tool = cornerstoneTools.getToolStateForStack(
    //   element,
    //   'RectangleRoi'
    // );

    // console.log({ state_stack_tool });

    if (tool_data.data.length > 1) {
      UINotificationService.show({
        title: 'Overwrite Alert',
        message: 'Taking new dimensions would remove previous selected ones',
        type: 'warning',
      });
    }
  });
};

export default TriggerAlgorithm;
