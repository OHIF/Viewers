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
    if (process.env.TEST_ENV === 'true') {
      return;
    }

    return serviceImplementation._hide(id);
  }

  /**
   * Create and show a new UI notification; returns the
   * ID of the created notification. Can also handle promises for loading states.
   *
   * @param {object} notification - The notification object
   * @param {string} notification.title - The title of the notification
   * @param {string | function} notification.message - The message content of the notification or a function that returns a message
   * @param {number} [notification.duration=5000] - The duration to show the notification (in milliseconds)
   * @param {'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'} [notification.position='bottom-right'] - The position of the notification
   * @param {ToastType} [notification.type='info'] - The type of the notification
   * @param {boolean} [notification.autoClose=true] - Whether the notification should auto-close
   * @param {Promise} [notification.promise] - A promise to track for loading, success, and error states
   * @param {object} [notification.promiseMessages] - Custom messages for promise states
   * @param {string} [notification.promiseMessages.loading] - Message to show while promise is pending
   * @param {string | function} [notification.promiseMessages.success] - Message to show when promise resolves
   * @param {string | function} [notification.promiseMessages.error] - Message to show when promise rejects
   * @param {object} [notification.action] - Action button configuration
   * @param {string} notification.action.label - The label for the action button
   * @param {function} notification.action.onClick - The function to call when the action button is clicked
   * @returns {string} id - The ID of the created notification
   */
  show({
    title,
    message,
    duration = 2000,
    position = 'bottom-right',
    type = 'info',
    autoClose = true,
    promise,
    promiseMessages,
    id,
    allowDuplicates = false,
    deduplicationInterval = 30000,
    action,
  }: {
    title: string;
    message: string | ((data?: any) => string);
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
    promise?: Promise<any>;
    promiseMessages?: {
      loading?: string;
      success?: string | ((data: any) => string);
      error?: string | ((error: any) => string);
    };
    id?: string;
    allowDuplicates?: boolean;
    deduplicationInterval?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }): string {
    if (process.env.TEST_ENV === 'true') {
      return;
    }

    if (promise && promiseMessages) {
      const loadingId = serviceImplementation._show({
        title,
        message: promiseMessages.loading || 'Loading...',
        type: 'loading',
        autoClose: false,
        position,
        id: id ? `${id}-loading` : undefined,
        allowDuplicates,
        deduplicationInterval,
      });

      promise.then(
        data => {
          const successMessage =
            typeof promiseMessages.success === 'function'
              ? promiseMessages.success(data)
              : promiseMessages.success || 'Success';

          serviceImplementation._show({
            title,
            message: successMessage,
            type: 'success',
            duration,
            position,
            autoClose,
            id: id ? `${id}-success` : undefined,
            allowDuplicates,
            deduplicationInterval,
            action,
          });
          this.hide(loadingId);
        },
        error => {
          const errorMessage =
            typeof promiseMessages.error === 'function'
              ? promiseMessages.error(error)
              : promiseMessages.error || 'Error';

          serviceImplementation._show({
            title,
            message: errorMessage,
            type: 'error',
            duration,
            position,
            autoClose,
            id: id ? `${id}-error` : undefined,
            allowDuplicates,
            deduplicationInterval,
            action,
          });
          this.hide(loadingId);
        }
      );

      return loadingId;
    }

    return serviceImplementation._show({
      title,
      message,
      duration,
      position,
      type,
      autoClose,
      id,
      allowDuplicates,
      deduplicationInterval,
      action,
    });
  }
}

export default UINotificationService;
