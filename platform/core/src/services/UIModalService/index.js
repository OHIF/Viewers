/**
 * A UI Element
 *
 * @typedef {ReactElement|HTMLElement} Modal
 */

/**
 * UI Modal
 *
 * @typedef {Object} ModalProps
 * @property {boolean} [shouldCloseOnEsc=false] -
 * @property {boolean} [isOpen=true] -
 * @property {boolean} [closeButton=true] -
 * @property {string} [title=null] - 'Modal Title'
 * @property {string} [customClassName=null] - '.ModalClass'
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
 * @param {Modal} component React component
 * @param {ModalProps} props { shouldCloseOnEsc, isOpen, closeButton, title, customClassName }
 */
function show(
  component,
  props = {
    shouldCloseOnEsc: false,
    isOpen: true,
    closeButton: true,
    title: null,
    customClassName: null,
  }
) {
  return uiModalServiceImplementation._show(component, props);
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
