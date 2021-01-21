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
 * @property {object} [action=null]
 */

const name = 'UINotificationService';

const serviceShowRequestQueue = [];

const publicAPI = {
  name,
  hide: _hide,
  show: _show,
  setServiceImplementation,
};

const serviceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: showArguments => {
    serviceShowRequestQueue.push(showArguments);

    console.warn('show() NOT IMPLEMENTED');
  },
};

/**
 * Create and show a new UI notification; returns the
 * ID of the created notification.
 *
 * @param {Notification} notification { title, message, duration, position, type, autoClose, action}
 * @returns {number} id
 */
function _show({
  title,
  message,
  duration = 5000,
  position = 'bottomRight',
  type = 'info',
  autoClose = true,
  action = null,
}) {
  return serviceImplementation._show({
    title,
    message,
    duration,
    position,
    type,
    autoClose,
    action,
  });
}

/**
 * Hides/dismisses the notification, if currently shown
 *
 * @param {number} id - id of the notification to hide/dismiss
 * @returns undefined
 */
function _hide(id) {
  return serviceImplementation._hide({ id });
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

    while (serviceShowRequestQueue.length > 0) {
      const showArguments = serviceShowRequestQueue.pop();
      serviceImplementation._show(showArguments);
    }
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
