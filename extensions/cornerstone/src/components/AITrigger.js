import { useContext } from 'react';
import { getEnabledElement } from '../state';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
// import { JobsContext } from '../../../../platform/viewer/src/context/JobsContext';

const TriggerAlgorithm = ({ viewports, servicesManager }) => {
  // const { jobDetails, setJobDetails } = useContext(JobsContext);
  let count = 0;

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
    const toolState =
      cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    if (Object.keys(toolState).length > 0) {
      cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
        {}
      );
      cornerstone.updateImage(element);
      cornerstoneTools.addToolState(
        element,
        'RectangleRoi',
        event_data.measurementData
      );
    }

    // retrieving rectangle tool roi data from element
    const tool_data = cornerstoneTools.getToolState(element, 'RectangleRoi');

    // console.log({ ToolData: tool_data.data });

    // if (tool_data && tool_data.data.length > 0) {
    //   let startX = parseInt(tool_data.data[0].handles.start.x.toFixed(2));
    //   let startY = parseInt(tool_data.data[0].handles.start.y.toFixed(2));
    //   let endX = parseInt(tool_data.data[0].handles.end.x.toFixed(2));
    //   let endY = parseInt(tool_data.data[0].handles.end.y.toFixed(2));

    //   const x_min = Math.min(startX, endX);
    //   const x_max = Math.max(startX, endX);
    //   const y_min = Math.min(startY, endY);
    //   const y_max = Math.max(startY, endY);
    //   const width = x_max - x_min;
    //   const height = y_max - y_min;

    //   const data = {x_min, y_min, width, height };

    //   setJobDetails(data);
    // }
  });

  // adding event listener for when user starts to get new dimensions
  element.addEventListener(EVENTS.MEASUREMENT_ADDED, () => {
    const toolState =
      cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    if (Object.keys(toolState).length > 0) {
      if (count === 1) {
        return;
      } else {
        UINotificationService.show({
          title: 'Overwrite Alert',
          message: 'Taking new dimensions would remove previous selected ones',
          type: 'warning',
          duration: 10000,
        });
        count++;
      }
    }
  });
};

export default TriggerAlgorithm;
