/**
 * UI Labelling Flow
 *
 * @typedef {Object} LabellingFlowProps
 * @property {Object} defaultPosition The position of the labelling dialog.
 * @property {boolean} centralize conditional to center the labelling dialog.
 * @property {Object} props The labelling props.
 *
 */

const uiLabellingFlowServicePublicAPI = {
  name: 'UILabellingFlowService',
  show,
  hide,
  setServiceImplementation,
};

const uiLabellingFlowServiceImplementation = {
  _show: () => console.warn('show() NOT IMPLEMENTED'),
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
};

function createUILabellingFlowService() {
  return uiLabellingFlowServicePublicAPI;
}

/**
 * Hide a UI LabellingFlow dialog;
 *
 */
function hide() {
  return uiLabellingFlowServiceImplementation._hide();
}

/**
 * Show a new UI LabellingFlow dialog;
 *
 * @param {LabellingFlowProps} props { defaultPosition, centralize, props }
 */
function show({ defaultPosition, centralize, props }) {
  return uiLabellingFlowServiceImplementation._show({
    defaultPosition,
    centralize,
    props,
  });
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
    uiLabellingFlowServiceImplementation._show = showImplementation;
  }
  if (hideImplementation) {
    uiLabellingFlowServiceImplementation._hide = hideImplementation;
  }
}

export default createUILabellingFlowService;
