/**
 * A UI Notification
 *
 * @typedef {Object} Notification
 * @property {string} title -
 * @property {string} message -
 * @property {number} [duration=5000] - in ms
 * @property {string} [position="bottomRight"] -"topLeft" | "topCenter | "topRight" | "bottomLeft" | "bottomCenter" | "bottomRight"
 * @property {string} [type="info"] - "info" | "error" | "warning" | "success"
 * @property {boolean} [autoClose=true]
 */

const serviceShowRequestQueue = [];

const serviceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: showArguments => {
    serviceShowRequestQueue.push(showArguments);

    console.warn('show() NOT IMPLEMENTED');
  },
};

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

      while (serviceShowRequestQueue.length > 0) {
        const showArguments = serviceShowRequestQueue.pop();
        serviceImplementation._show(showArguments);
      }
    }
  }

  /**
   * Hides/dismisses the notification, if currently shown
   *
   * @param {number} id - id of the notification to hide/dismiss
   * @returns undefined
   */
  public hide(id: string) {
    return serviceImplementation._hide({ id });
  }

  /**
   * Create and show a new UI notification; returns the
   * ID of the created notification.
   *
   * @param {Notification} notification { title, message, duration, position, type, autoClose}
   * @returns {number} id
   */
  show({
    title,
    message,
    duration = 5000,
    position = 'bottomRight',
    type = 'info',
    autoClose = true,
  }) {
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
