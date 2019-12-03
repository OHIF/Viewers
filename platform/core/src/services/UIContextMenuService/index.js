/**
 * UI Context Menu
 *
 * @typedef {Object} ContextMenuProps
 * @property {Event} event The event with tool information.
 */

const uiContextMenuServicePublicAPI = {
  name: 'UIContextMenuService',
  hide,
  show,
  setServiceImplementation,
};

const uiContextMenuServiceImplementation = {
  _show: () => console.warn('show() NOT IMPLEMENTED'),
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
};

function createUIContextMenuService() {
  return uiContextMenuServicePublicAPI;
}

/**
 * Show a new UI ContextMenu dialog;
 *
 * @param {ContextMenuProps} props { event }
 */
function show({ event }) {
  return uiContextMenuServiceImplementation._show({
    event,
  });
}

/**
 * Hide a UI ContextMenu dialog;
 *
 */
function hide() {
  return uiContextMenuServiceImplementation._hide();
}

/**
 *
 *
 * @param {*} {
 *   show: showImplementation,
 *   hide: hideImplementation,
 * }
 */
function setServiceImplementation({
  show: showImplementation,
  hide: hideImplementation,
}) {
  if (showImplementation) {
    uiContextMenuServiceImplementation._show = showImplementation;
  }
  if (hideImplementation) {
    uiContextMenuServiceImplementation._hide = hideImplementation;
  }
}

export default createUIContextMenuService;
