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
 * @property {boolean} [showScrollbar=false] Show or hide scrollbar.
 * @property {boolean} [noScroll=false] Disable or not the scrollbar.
 */

const name = 'UIModalService';

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
 * Show a new UI modal;
 *
 * @param {ModalProps} props { content, contentProps, shouldCloseOnEsc, isOpen, onClose, closeButton, title, customClassName, showScrollbar, noScroll }
 */
function _show({
  content = null,
  contentProps = null,
  shouldCloseOnEsc = false,
  isOpen = true,
  onClose = null,
  closeButton = true,
  title = null,
  fullscreen = false,
  customClassName = null,
  showScrollbar = false,
  noScroll = false,
}) {
  return serviceImplementation._show({
    content,
    contentProps,
    shouldCloseOnEsc,
    isOpen,
    onClose,
    closeButton,
    title,
    fullscreen,
    customClassName,
    showScrollbar,
    noScroll,
  });
}

/**
 * Hides/dismisses the modal, if currently shown
 *
 * @returns void
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
 * }
 */
function setServiceImplementation({
  hide: hideImplementation,
  show: showImplementation,
}) {
  if (hideImplementation) {
    serviceImplementation._hide = hideImplementation;
  }
  if (showImplementation) {
    serviceImplementation._show = showImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
