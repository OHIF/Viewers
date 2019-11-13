import {
  resetLabellingAndContextMenuAction,
  setToolContextMenuDataAction,
  setLabellingFlowDataAction,
} from './actions.js';
import updateTableWithNewMeasurementData from './updateTableWithNewMeasurementData.js';

const VIEWPORT_INDEX = 0;

function getOnRightClickCallback(store) {
  const setToolContextMenuData = (viewportIndex, toolContextMenuData) => {
    store.dispatch(resetLabellingAndContextMenuAction());
    store.dispatch(
      setToolContextMenuDataAction(viewportIndex, toolContextMenuData)
    );
  };

  const getOnCloseCallback = viewportIndex => {
    return function onClose() {
      const toolContextMenuData = {
        visible: false,
      };

      store.dispatch(
        setToolContextMenuDataAction(viewportIndex, toolContextMenuData)
      );
    };
  };

  return function onRightClick(event) {
    const eventData = event.detail;
    const viewportIndex = VIEWPORT_INDEX; // parseInt(eventData.element.dataset.viewportIndex, 10);

    const toolContextMenuData = {
      eventData,
      isTouchEvent: false,
      onClose: getOnCloseCallback(viewportIndex),
    };

    // setToolContextMenuData(viewportIndex, toolContextMenuData);
    setToolContextMenuData(0, toolContextMenuData);
  };
}

function getOnTouchPressCallback(store) {
  const setToolContextMenuData = (viewportIndex, toolContextMenuData) => {
    store.dispatch(resetLabellingAndContextMenuAction());
    store.dispatch(
      setToolContextMenuDataAction(viewportIndex, toolContextMenuData)
    );
  };

  const getOnCloseCallback = viewportIndex => {
    return function onClose() {
      const toolContextMenuData = {
        visible: false,
      };

      store.dispatch(
        setToolContextMenuDataAction(viewportIndex, toolContextMenuData)
      );
    };
  };

  return function onTouchPress(event) {
    const eventData = event.detail;
    const viewportIndex = parseInt(eventData.element.dataset.viewportIndex, 10);

    const toolContextMenuData = {
      eventData,
      isTouchEvent: true,
      onClose: getOnCloseCallback(viewportIndex),
    };

    setToolContextMenuData(viewportIndex, toolContextMenuData);
  };
}

function getResetLabellingAndContextMenu(store) {
  return function resetLabellingAndContextMenu() {
    store.dispatch(resetLabellingAndContextMenuAction());
  };
}

/**
 *
 *
 * @param {*} store
 * @returns
 */
function getToolLabellingFlowCallback(store) {
  const setLabellingFlowData = labellingFlowData => {
    store.dispatch(setLabellingFlowDataAction(labellingFlowData));
  };

  return function toolLabellingFlowCallback(
    measurementData,
    eventData,
    doneCallback,
    options = {}
  ) {
    const updateLabelling = ({ location, response, description }) => {
      // Update the measurement data with the labelling parameters

      if (location) {
        measurementData.location = location;
      }

      measurementData.description = description || '';

      if (response) {
        measurementData.response = response;
      }

      updateTableWithNewMeasurementData(measurementData);
    };

    const labellingDoneCallback = () => {
      setLabellingFlowData({ visible: false });
    };

    const labellingFlowData = {
      visible: true,
      eventData,
      measurementData,
      skipAddLabelButton: options.skipAddLabelButton,
      editLocation: options.editLocation,
      editDescription: options.editDescription,
      editResponse: options.editResponse,
      editDescriptionOnDialog: options.editDescriptionOnDialog,
      labellingDoneCallback,
      updateLabelling,
    };

    setLabellingFlowData(labellingFlowData);
  };
}

export {
  getToolLabellingFlowCallback,
  getOnRightClickCallback,
  getOnTouchPressCallback,
  getResetLabellingAndContextMenu,
};
