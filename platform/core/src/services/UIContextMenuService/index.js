/**
 * UI Context Menu
 *
 * @typedef {Object} ContextMenuProps
 * @property {Event} event The event with tool information.
 */

const name = 'UIContextMenuService';

const publicAPI = {
  name,
  hide: _hide,
  show: _show,
  setServiceImplementation,
};

const serviceImplementation = {
  _show: () => console.warn('show() NOT IMPLEMENTED'),
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
};

/**
 * Show a new UI ContextMenu dialog;
 *
 * @param {ContextMenuProps} props { event }
 */
function _show({ event }) {
  return serviceImplementation._show({
    event,
  });
}

/**
 * Hide a UI ContextMenu dialog;
 *
 */
function _hide() {
  return serviceImplementation._hide();
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
    serviceImplementation._show = showImplementation;
  }
  if (hideImplementation) {
    serviceImplementation._hide = hideImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
