import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import {
  getToolLabellingFlowCallback,
  getOnRightClickCallback,
  getOnTouchPressCallback,
  getResetLabellingAndContextMenu,
} from './labelingFlowCallbacks.js';
import throttle from 'lodash.throttle';

// TODO: This only works because we have a hard dependency on this extension
// We need to decouple and make stuff like this possible w/o bundling this at
// build time
import store from './../../store';

const {
  onAdded,
  onRemoved,
  onModified,
} = OHIF.measurements.MeasurementHandlers;

const MEASUREMENT_ACTION_MAP = {
  added: onAdded,
  removed: onRemoved,
  modified: throttle(event => {
    return onModified(event);
  }, 300),
};

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

  // TODO: MEASUREMENT_COMPLETED (not present in initial implementation)
  const onMeasurementsChanged = (action, event) => {
    return MEASUREMENT_ACTION_MAP[action](event);
  };
  const onMeasurementAdded = onMeasurementsChanged.bind(this, 'added');
  const onMeasurementRemoved = onMeasurementsChanged.bind(this, 'removed');
  const onMeasurementModified = onMeasurementsChanged.bind(this, 'modified');
  const onLabelmapModified = onMeasurementsChanged.bind(
    this,
    'labelmapModified'
  );
  //
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

    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.addEventListener(
      csTools.EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.addEventListener(
      csTools.EVENTS.LABELMAP_MODIFIED,
      onLabelmapModified
    );
    //
    element.addEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.addEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.addEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
    // TODO: This makes scrolling painfully slow
    // element.addEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
  }

  function elementDisabledHandler(evt) {
    const element = evt.detail.element;

    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_ADDED,
      onMeasurementAdded
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_REMOVED,
      onMeasurementRemoved
    );
    element.removeEventListener(
      csTools.EVENTS.MEASUREMENT_MODIFIED,
      onMeasurementModified
    );
    element.removeEventListener(
      csTools.EVENTS.LABELMAP_MODIFIED,
      onLabelmapModified
    );
    //
    element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);
    // element.removeEventListener(cornerstone.EVENTS.NEW_IMAGE, onNewImage);
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
