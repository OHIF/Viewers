import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import throttle from 'lodash.throttle';

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
 * @param {Object} servicesManager
 * @param {Object} configuration
 */
export default function init({
  servicesManager,
  commandsManager,
  configuration = {},
}) {
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

  const onRightClick = event => {
    commandsManager.runCommand('showContextMenu', {
      event: event.detail,
    });
  };

  const onTouchPress = event => {
    commandsManager.runCommand('showContextMenu', {
      event: event.detail,
      props: {
        isTouchEvent: true,
      },
    });
  };

  const onTouchStart = () => {
    commandsManager.runCommand('hideContextMenu');
    commandsManager.runCommand('hideLabellingFlow');
  };

  const onMouseClick = () => {
    commandsManager.runCommand('hideContextMenu');
    commandsManager.runCommand('hideLabellingFlow');
  };

  // TODO: This makes scrolling painfully slow
  // const onNewImage = getResetLabellingAndContextMenu(store);

  /*
   * Because click gives us the native "mouse up", buttons will always be `0`
   * Need to fallback to event.which;
   *
   */
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

    element.removeEventListener(csTools.EVENTS.TOUCH_PRESS, onTouchPress);
    element.removeEventListener(csTools.EVENTS.MOUSE_CLICK, handleClick);
    element.removeEventListener(csTools.EVENTS.TOUCH_START, onTouchStart);

    // TODO: This makes scrolling painfully slow
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
