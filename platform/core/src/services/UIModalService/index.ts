const name = 'uiModalService';

const serviceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: () => console.warn('show() NOT IMPLEMENTED'),
  _customComponent: null,
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
    title = null,
    className = null,
    shouldCloseOnEsc = true,
    shouldCloseOnOverlayClick = true,
    containerClassName = null,
  }) {
    return serviceImplementation._show({
      content,
      contentProps,
      shouldCloseOnEsc,
      title,
      className,
      shouldCloseOnOverlayClick,
      containerClassName,
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
   * This provides flexibility in customizing the Modal's default component
   *
   * @returns {React.Component}
   */
  getCustomComponent() {
    return serviceImplementation._customComponent;
  }

  /**
   *
   *
   * @param {*} {
   *   hide: hideImplementation,
   *   show: showImplementation,
   * }
   */
  setServiceImplementation({
    hide: hideImplementation,
    show: showImplementation,
    customComponent: customComponentImplementation,
  }) {
    if (hideImplementation) {
      serviceImplementation._hide = hideImplementation;
    }
    if (showImplementation) {
      serviceImplementation._show = showImplementation;
    }
    if (customComponentImplementation) {
      serviceImplementation._customComponent = customComponentImplementation;
    }
  }
}

export default UIModalService;
