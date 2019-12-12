/**
 * UI Labelling Flow
 *
 * @typedef {Object} LabellingFlowProps
 * @property {Object} defaultPosition The position of the labelling dialog.
 * @property {boolean} centralize conditional to center the labelling dialog.
 * @property {Object} props The labelling props.
 *
 */

const name = 'UILabellingFlowService';

const publicAPI = {
  name,
  show: _show,
  hide: _hide,
  setServiceImplementation,
};

const serviceImplementation = {
  _show: () => console.warn('show() NOT IMPLEMENTED'),
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
};

/**
 * Hide a UI LabellingFlow dialog;
 *
 */
function _hide() {
  return serviceImplementation._hide();
}

/**
 * Show a new UI LabellingFlow dialog;
 *
 * @param {LabellingFlowProps} props { defaultPosition, centralize, props }
 */
function _show({ defaultPosition, centralize, props }) {
  return serviceImplementation._show({
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
