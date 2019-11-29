/**
 * UI Context Menu
 *
 * @typedef {Object} ContextMenuProps
 * @property {Event} event The event with tool information.
 */

const uiContextMenuServicePublicAPI = {
  name: 'UIContextMenuService',
  show,
  setServiceImplementation,
};

const uiContextMenuServiceImplementation = {
  _show: () => console.warn('show() NOT IMPLEMENTED'),
};

function createUIContextMenuService() {
  return uiContextMenuServicePublicAPI;
}

/**
 * Show a new UI ContextMenu;
 *
 * @param {ContextMenuProps} props {  }
 */
function show({ event, updateLabellingCallback }) {
  return uiContextMenuServiceImplementation._show({
    event,
    updateLabellingCallback,
  });
}

/**
 *
 *
 * @param {*} {
 *   show: showImplementation,
 * }
 */
function setServiceImplementation({ show: showImplementation }) {
  if (showImplementation) {
    uiContextMenuServiceImplementation._show = showImplementation;
  }
}

export default createUIContextMenuService;
