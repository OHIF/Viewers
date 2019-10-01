import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import {
  getToolLabellingFlowCallback,
  getOnRightClickCallback,
  getOnTouchPressCallback,
  getResetLabellingAndContextMenu,
} from './labelingFlowCallbacks.js';

// TODO: This only works because we have a hard dependency on this extension
// We need to decouple and make stuff like this possible w/o bundling this at
// build time
import store from './../../store';

/**
 *
 *
 * @export
 * @param {*} configuration
 */
export default function init(configuration) {
  // If these tools were already added by a different extension, we want to replace
  // them with the same tools that have an alternative configuration. By passing in
  // our custom `getMeasurementLocationCallback`, we can...
  const toolLabellingFlowCallback = getToolLabellingFlowCallback(store);
  console.warn('~~~~~~~~~ MEASUREMENTS PANEL INIT');

  // Removes all tools from all enabled elements w/ provided name
  // Not commonly used API, so :eyes: for unknown side-effects
  csTools.removeTool('Bidirectional');
  csTools.removeTool('Length');
  csTools.removeTool('Angle');
  csTools.removeTool('FreehandRoi');
  csTools.removeTool('EllipticalRoi');
  csTools.removeTool('CircleRoi');
  csTools.removeTool('RectangleRoi');
  csTools.removeTool('ArrowAnnotate');

  // Re-add each tool w/ our custom configuration
  csTools.addTool(csTools.BidirectionalTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.LengthTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.AngleTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.FreehandRoiTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.EllipticalRoiTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.CircleRoiTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.RectangleRoiTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });
  csTools.addTool(csTools.ArrowAnnotateTool, {
    configuration: {
      getMeasurementLocationCallback: toolLabellingFlowCallback,
    },
  });

  const onRightClick = getOnRightClickCallback(store);
  const onTouchPress = getOnTouchPressCallback(store);
  const onNewImage = getResetLabellingAndContextMenu(store);
  const onMouseClick = getResetLabellingAndContextMenu(store);
  const onTouchStart = getResetLabellingAndContextMenu(store);

  // Because click gives us the native "mouse up", buttons will always be `0`
  // Need to fallback to event.which;
  const handleClick = cornerstoneMouseClickEvent => {
    const mouseUpEvent = cornerstoneMouseClickEvent.detail.event;
    const isRightClick = mouseUpEvent.which === 3;

    if (isRightClick) {
      onRightClick(cornerstoneMouseClickEvent);
    } else {
      onMouseClick(cornerstoneMouseClickEvent);
    }
  };

  function elementEnabledHandler(evt) {
    const element = evt.detail.element;
    console.log('Setting up events for: ', element);

    element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.addEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.addEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
    element.addEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;
    console.log('Tearing down events for: ', element);

    element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
    element.removeEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler
  );
  cornerstone.events.addEventListener(
    cornerstone.EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler
  );
}
