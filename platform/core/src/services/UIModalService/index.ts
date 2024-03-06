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

const name = 'uiModalService';

const serviceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: () => console.warn('show() NOT IMPLEMENTED'),
};

class UIModalService {
  static REGISTRATION = {
    name,
    altName: 'UIModalService',
    create: (): UIModalService => {
      return new UIModalService();
    },
  };

  readonly name = name;

  /**
   * Show a new UI modal;
   *
   * @param {ModalProps} props { content, contentProps, shouldCloseOnEsc, isOpen, closeButton, title, customClassName }
   */
  show({
    content = null,
    contentProps = null,
    shouldCloseOnEsc = true,
    isOpen = true,
    closeButton = true,
    title = null,
    customClassName = null,
    movable = false,
    containerDimensions = null,
    contentDimensions = null,
  }) {
    return serviceImplementation._show({
      content,
      contentProps,
      shouldCloseOnEsc,
      isOpen,
      closeButton,
      title,
      customClassName,
      movable,
      containerDimensions,
      contentDimensions,
    });
  }

  /**
   * Hides/dismisses the modal, if currently shown
   *
   * @returns void
   */
  hide() {
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
  setServiceImplementation({ hide: hideImplementation, show: showImplementation }) {
    if (hideImplementation) {
      serviceImplementation._hide = hideImplementation;
    }
    if (showImplementation) {
      serviceImplementation._show = showImplementation;
    }
  }
}

export default UIModalService;
