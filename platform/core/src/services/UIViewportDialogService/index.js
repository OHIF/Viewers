/**
 * Viewport Dialog
 *
 * @typedef {Object} ViewportDialogProps
 * @property {ReactElement|HTMLElement} [content=null] Modal content.
 * @property {Object} [contentProps=null] Modal content props.
 * @property {boolean} [viewportIndex=false] Modal is dismissible via the esc key.
 */

const name = 'UIViewportDialogService';

const publicAPI = {
  name,
  hide: _hide,
  show: _show,
  setServiceImplementation,
};

const serviceImplementation = {
  _viewports: [],
};

/**
 * Show a new UI viewport dialog on the specified viewportIndex;
 *
 * @param {ViewportDialogProps} props { content, contentProps, viewportIndex }
 */
function _show({ content = null, contentProps = null, viewportIndex }) {
  const viewportIndexImplementation =
    (viewportIndex !== undefined &&
      serviceImplementation._viewports[viewportIndex]) ||
    {};

  if (!viewportIndexImplementation._show) {
    console.warn('show() NOT IMPLEMENTED');
    return;
  }

  return viewportIndexImplementation._show({
    content,
    contentProps,
    viewportIndex,
  });
}

/**
 * Hides/dismisses the viewport dialog, if currently shown
 *
 * @param {*} { viewportIndex }
 */
function _hide({ viewportIndex }) {
  const viewportIndexImplementation =
    (viewportIndex && serviceImplementation._viewports[viewportIndex]) || {};

  if (!viewportIndexImplementation._hide) {
    console.warn('hide() NOT IMPLEMENTED');
    return;
  }

  return viewportIndexImplementation._hide();
}

/**
 *
 *
 * @param {*} {
 *   hide: hideImplementation,
 *   show: showImplementation,
 *   viewportIndex,
 * }
 */
function setServiceImplementation({
  hide: hideImplementation,
  show: showImplementation,
  viewportIndex,
}) {
  if (viewportIndex !== undefined) {
    const newImplementations = {};
    if (hideImplementation) {
      newImplementations._hide = hideImplementation;
    }
    if (showImplementation) {
      newImplementations._show = showImplementation;
    }

    serviceImplementation._viewports[viewportIndex] = Object.assign(
      {},
      serviceImplementation._viewports[viewportIndex],
      newImplementations
    );
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
