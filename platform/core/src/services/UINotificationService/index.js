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

const uiNotificationServicePublicAPI = {
  name: 'UINotificationService',
  hide,
  show,
  setServiceImplementation,
};

const uiNotificationServiceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: () => console.warn('show() NOT IMPLEMENTED'),
};

function createUINotificationService() {
  return uiNotificationServicePublicAPI;
}

/**
 * Create and show a new UI notification; returns the
 * ID of the created notification.
 *
 * @param {Notification} notification { title, message, duration, position, type, autoClose}
 * @returns {number} id
 */
function show({
  title,
  message,
  duration = 5000,
  position = 'bottomRight',
  type = 'info',
  autoClose = true,
}) {
  return uiNotificationServiceImplementation._show({
    title,
    message,
    duration,
    position,
    type,
    autoClose,
  });
}

/**
 * Hides/dismisses the notification, if currently shown
 *
 * @param {number} id - id of the notification to hide/dismiss
 * @returns undefined
 */
function hide(id) {
  return uiNotificationServiceImplementation._hide({ id });
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
    uiNotificationServiceImplementation._hide = hideImplementation;
  }
  if (showImplementation) {
    uiNotificationServiceImplementation._show = showImplementation;
  }
}

export default createUINotificationService;
