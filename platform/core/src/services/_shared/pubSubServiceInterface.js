import guid from '../../utils/guid';

/**
 * Consumer must implement:
 * this.listeners = {}
 * this.EVENTS = { "EVENT_KEY": "EVENT_VALUE" }
 */
export default {
  subscribe,
  publish,
  _unsubscribe,
  _isValidEvent,
};

/**
 * Subscribe to updates.
 *
 * @param {string} eventName The name of the event
 * @param {Function} callback Events callback
 * @return {Object} Observable object with actions
 */
function subscribe(eventName, callback) {
  if (this._isValidEvent(eventName)) {
    const listenerId = guid();
    const subscription = { id: listenerId, callback };

    console.info(`Subscribing to '${eventName}'.`);
    if (Array.isArray(this.listeners[eventName])) {
      this.listeners[eventName].push(subscription);
    } else {
      this.listeners[eventName] = [subscription];
    }

    return {
      unsubscribe: () => this._unsubscribe(eventName, listenerId),
    };
  } else {
    throw new Error(`Event ${eventName} not supported.`);
  }
}

/**
 * Unsubscribe to measurement updates.
 *
 * @param {string} eventName The name of the event
 * @param {string} listenerId The listeners id
 * @return void
 */
function _unsubscribe(eventName, listenerId) {
  if (!this.listeners[eventName]) {
    return;
  }

  const listeners = this.listeners[eventName];
  if (Array.isArray(listeners)) {
    this.listeners[eventName] = listeners.filter(({ id }) => id !== listenerId);
  } else {
    this.listeners[eventName] = undefined;
  }
}

/**
 * Check if a given event is valid.
 *
 * @param {string} eventName The name of the event
 * @return {boolean} Event name validation
 */
function _isValidEvent(eventName) {
  return Object.values(this.EVENTS).includes(eventName);
}

/**
 * Broadcasts changes.
 *
 * @param {string} eventName - The event name
 * @param {func} callbackProps - Properties to pass callback
 * @return void
 */
function publish(eventName, callbackProps) {
  const hasListeners = Object.keys(this.listeners).length > 0;
  const hasCallbacks = Array.isArray(this.listeners[eventName]);

  if (hasListeners && hasCallbacks) {
    this.listeners[eventName].forEach(listener => {
      listener.callback(callbackProps);
    });
  }
}
