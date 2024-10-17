const serviceImplementation = {
  _hide: () => console.debug('hide() NOT IMPLEMENTED'),
  _show: showArguments => {
    console.debug('show() NOT IMPLEMENTED');
    return null;
  },
};

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

class UINotificationService {
  static REGISTRATION = {
    name: 'uiNotificationService',
    altName: 'UINotificationService',
    create: (): UINotificationService => {
      return new UINotificationService();
    },
  };

  /**
   *
   *
   * @param {*} {
   *   hide: hideImplementation,
   *   show: showImplementation,
   * }
   */
  public setServiceImplementation({ hide: hideImplementation, show: showImplementation }): void {
    if (hideImplementation) {
      serviceImplementation._hide = hideImplementation;
    }
    if (showImplementation) {
      serviceImplementation._show = showImplementation;
    }
  }

  /**
   * Hides/dismisses the notification, if currently shown
   *
   * @param {number} id - id of the notification to hide/dismiss
   * @returns undefined
   */
  public hide(id: string) {
    return serviceImplementation._hide(id);
  }

  /**
   * Create and show a new UI notification; returns the
   * ID of the created notification.
   *
   * @param {object} notification - The notification object
   * @param {string} notification.title - The title of the notification
   * @param {string} notification.message - The message content of the notification
   * @param {number} [notification.duration=5000] - The duration to show the notification (in milliseconds)
   * @param {'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'} [notification.position='bottom-right'] - The position of the notification
   * @param {ToastType} [notification.type='info'] - The type of the notification
   * @param {boolean} [notification.autoClose=true] - Whether the notification should auto-close
   * @returns {string} id - The ID of the created notification
   */
  show({
    title,
    message,
    duration = 5000,
    position = 'bottom-right',
    type = 'info',
    autoClose = true,
  }: {
    title: string;
    message: string;
    duration?: number;
    position?:
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
      | 'top-center'
      | 'bottom-center';
    type?: ToastType;
    autoClose?: boolean;
  }): string {
    return serviceImplementation._show({
      title,
      message,
      duration,
      position,
      type,
      autoClose,
    });
  }
}

export default UINotificationService;
