/**
 * UI Context Menu
 *
 * @typedef {Object} ContextMenuProps
 * @property {Event} event The event with tool information.
 */

/**
 * UI Labelling Flow
 *
 * @typedef {Object} LabellingFlowProps
 * @property {Event} event The event with tool information.
 */

const uiContextMenuServicePublicAPI = {
  name: 'UIContextMenuService',
  showLabellingFlow,
  showContextMenu,
  setServiceImplementation,
};

const uiContextMenuServiceImplementation = {
  _showLabellingFlow: () => console.warn('showLabellingFlow() NOT IMPLEMENTED'),
  _showContextMenu: () => console.warn('showLabellingFlow() NOT IMPLEMENTED'),
};

function createUIContextMenuService() {
  return uiContextMenuServicePublicAPI;
}

/**
 * Show a new UI ContextMenu;
 *
 * @param {ContextMenuProps} props {  }
 */
function showContextMenu({ event }) {
  return uiContextMenuServiceImplementation._showContextMenu({
    event,
  });
}

/**
 * Show a new UI LabellingFlow;
 *
 * @param {LabellingFlowProps} props {  }
 */
function showLabellingFlow({ defaultPosition, centralize, props }) {
  return uiContextMenuServiceImplementation._showLabellingFlow({
    defaultPosition,
    centralize,
    props,
  });
}

/**
 *
 *
 * @param {*} {
 *   showContextMenu: showContextMenuImplementation,
 *   showLabellingFlow: showLabellingFlowImplementation,
 * }
 */
function setServiceImplementation({
  showContextMenu: showContextMenuImplementation,
  showLabellingFlow: showLabellingFlowImplementation,
}) {
  if (showContextMenuImplementation) {
    uiContextMenuServiceImplementation._showContextMenu = showContextMenuImplementation;
  }
  if (showLabellingFlowImplementation) {
    uiContextMenuServiceImplementation._showLabellingFlow = showLabellingFlowImplementation;
  }
}

export default createUIContextMenuService;
