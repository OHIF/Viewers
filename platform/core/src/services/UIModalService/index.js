/**
 * UI Modal
 *
 * @typedef {Object} ModalProps
 * @property {ReactElement|HTMLElement} [content=null] Modal content.
 * @property {Object} [contentProps=null] Modal content props.
 * @property {boolean} [shouldCloseOnEsc=false] Modal is dismissible via the esc key.
 * @property {boolean} [isOpen=true] Make the Modal visible or hidden.
 * @property {boolean} [closeButton=true] Should the modal body render the close button.
 * @property {string} [title=null] Should the modal render the title independently of the body content.
 * @property {string} [customClassName=null] The custom class to style the modal.
 */

const uiModalServicePublicAPI = {
  name: 'UIModalService',
  hide,
  show,
  setServiceImplementation,
};

const uiModalServiceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: () => console.warn('show() NOT IMPLEMENTED'),
};

function createUIModalService() {
  return uiModalServicePublicAPI;
}

/**
 * Show a new UI modal;
 *
 * @param {ModalProps} props { content, contentProps, shouldCloseOnEsc, isOpen, closeButton, title, customClassName }
 */
function show({
  content = null,
  contentProps = null,
  shouldCloseOnEsc = false,
  isOpen = true,
  closeButton = true,
  title = null,
  customClassName = null,
}) {
  return uiModalServiceImplementation._show({
    content,
    contentProps,
    shouldCloseOnEsc,
    isOpen,
    closeButton,
    title,
    customClassName,
  });
}

/**
 * Hides/dismisses the modal, if currently shown
 *
 * @returns void
 */
function hide() {
  return uiModalServiceImplementation._hide();
}

/**
 *
 *
 * @param {*} {
 *   hide: hideImplementation,
 *   show: showImplementation,
 * }
 */
function setServiceImplementation({
  hide: hideImplementation,
  show: showImplementation,
}) {
  if (hideImplementation) {
    uiModalServiceImplementation._hide = hideImplementation;
  }
  if (showImplementation) {
    uiModalServiceImplementation._show = showImplementation;
  }
}

export default createUIModalService;
