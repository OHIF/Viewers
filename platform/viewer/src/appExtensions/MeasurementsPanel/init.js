import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import throttle from 'lodash.throttle';

import LabellingFlow from '../../components/Labelling/LabellingFlow';
import ToolContextMenu from '../../connectedComponents/ToolContextMenu';

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
  configuration,
}) {
  const { UIDialogService } = servicesManager.services;

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

  const _getDefaultPosition = event => ({
    x: (event && event.currentPoints.client.x) || 0,
    y: (event && event.currentPoints.client.y) || 0,
  });

  const _updateLabellingHandler = (labellingData, measurementData) => {
    const { location, description, response } = labellingData;

    if (location) {
      measurementData.location = location;
    }

    measurementData.description = description || '';

    if (response) {
      measurementData.response = response;
    }

    commandsManager.runCommand(
      'updateTableWithNewMeasurementData',
      measurementData
    );
  };

  const showLabellingDialog = (props, contentProps, measurementData) => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.create({
      id: 'labelling',
      isDraggable: false,
      showOverlay: true,
      centralize: true,
      content: LabellingFlow,
      contentProps: {
        measurementData,
        labellingDoneCallback: () =>
          UIDialogService.dismiss({ id: 'labelling' }),
        updateLabelling: labellingData =>
          _updateLabellingHandler(labellingData, measurementData),
        ...contentProps,
      },
      ...props,
    });
  };

  const onRightClick = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.create({
      id: 'context-menu',
      isDraggable: false,
      preservePosition: false,
      defaultPosition: _getDefaultPosition(event.detail),
      content: ToolContextMenu,
      contentProps: {
        eventData: event.detail,
        onDelete: (nearbyToolData, eventData) => {
          const element = eventData.element;
          commandsManager.runCommand('removeToolState', {
            element,
            toolType: nearbyToolData.toolType,
            tool: nearbyToolData.tool,
          });
        },
        onClose: () => UIDialogService.dismiss({ id: 'context-menu' }),
        onSetLabel: (eventData, measurementData) => {
          showLabellingDialog(
            { centralize: true, isDraggable: false },
            { skipAddLabelButton: true, editLocation: true },
            measurementData
          );
        },
        onSetDescription: (eventData, measurementData) => {
          showLabellingDialog(
            { defaultPosition: _getDefaultPosition(eventData) },
            { editDescriptionOnDialog: true },
            measurementData
          );
        },
      },
    });
  };

  const onTouchPress = event => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.create({
      eventData: event.detail,
      content: ToolContextMenu,
      contentProps: {
        isTouchEvent: true,
      },
    });
  };

  const onTouchStart = () => resetLabelligAndContextMenu();

  const onMouseClick = () => resetLabelligAndContextMenu();

  const resetLabelligAndContextMenu = () => {
    if (!UIDialogService) {
      console.warn('Unable to show dialog; no UI Dialog Service available.');
      return;
    }

    UIDialogService.dismiss({ id: 'context-menu' });
    UIDialogService.dismiss({ id: 'labelling' });
  };

  // TODO: This makes scrolling painfully slow
  // const onNewImage = ...

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
