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

  const enabledElement = cornerstone.getEnabledElement(element);
  if (!enabledElement || !enabledElement.image) {
    return;
  }

  const toolData = cornerstoneTools.getToolState(element, 'RectangleRoi');
  const stack = toolData;

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
    const eventData = e.detail;
    const toolData = cornerstoneTools.getToolState(element, 'RectangleRoi');

    console.log({ eventData });

    if (toolData.data.length > 0) {
      cornerstoneTools.clearToolState(element, 'RectangleRoi');

      cornerstone.updateImage(element);

      cornerstoneTools.addToolState(
        element,
        'RectangleRoi',
        eventData.measurementData
      );
    }
  });

  // adding event listener for when user starts to get new dimensions
  element.addEventListener(EVENTS.MEASUREMENT_ADDED, () => {
    const toolData = cornerstoneTools.getToolState(element, 'RectangleRoi');

    if (toolData.data.length > 1) {
      UINotificationService.show({
        title: 'Overwrite Alert',
        message: 'Taking new dimensions would remove previous selected ones',
        type: 'warning',
      });
    }
  });
};

export default TriggerAlgorithm;
