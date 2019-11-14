/**
 * A UI Element
 *
 * @typedef {ReactElement|HTMLElement} Modal
 */

/**
 * UI Modal
 *
 * @typedef {Object} ModalProps
 * @property {string} [header=null] -
 * @property {string} [footer=null] -
 * @property {string} [backdrop=false] -
 * @property {string} [keyboard=false] -
 * @property {number} [show=true] -
 * @property {string} [closeButton=true] -
 * @property {string} [title=null] - 'Modal Title'
 * @property {boolean} [customClassName=null] - '.ModalClass'
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
 * @param {ModalProps} props { header, footer, backdrop, keyboard, show, closeButton, title, customClassName }
 */
function show(component, props) {
  const {
    header = null,
    footer = null,
    backdrop = false,
    keyboard = false,
    show = true,
    closeButton = true,
    title = null,
    customClassName = null,
  } = props;
  return uiModalServiceImplementation._show(component, {
    header,
    footer,
    backdrop,
    keyboard,
    show,
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
