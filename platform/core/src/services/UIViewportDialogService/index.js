/**
 * Viewport Dialog
 *
 * @typedef {Object} ViewportDialogProps
 * @property {ReactElement|HTMLElement} [content=null] Modal content.
 * @property {Object} [contentProps=null] Modal content props.
 * @property {boolean} [viewportId=false] Modal is dismissible via the esc key.
 */

const name = 'uiViewportDialogService';

const publicAPI = {
  name,
  hide: _hide,
  show: _show,
  setServiceImplementation,
};

const serviceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: () => console.warn('show() NOT IMPLEMENTED'),
};

/**
 * Show a new UI viewport dialog on the specified viewportId;
 *
 * @param {ViewportDialogProps} props { content, contentProps, viewportId }
 */
function _show({ viewportId, id, type, message, actions, onSubmit, onOutsideClick }) {
  return serviceImplementation._show({
    viewportId,
    id,
    type,
    message,
    actions,
    onSubmit,
    onOutsideClick,
  });
}

/**
 * Hides/dismisses the viewport dialog, if currently shown
 */
function _hide() {
  return serviceImplementation._hide();
}

/**
 *
 *
 * @param {*} {
 *   hide: hideImplementation,
 *   show: showImplementation,
 *   viewportId,
 * }
 */
function setServiceImplementation({ hide: hideImplementation, show: showImplementation }) {
  if (hideImplementation) {
    serviceImplementation._hide = hideImplementation;
  }
  if (showImplementation) {
    serviceImplementation._show = showImplementation;
  }
}

export default {
  REGISTRATION: {
    name,
    altName: 'UIViewportDialogService',
    create: ({ configuration = {} }) => {
      return publicAPI;
    },
  },
};
