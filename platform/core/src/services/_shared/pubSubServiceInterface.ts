import guid from '../../utils/guid';

/**
 * Consumer must implement:
 * this.listeners = {}
 * this.EVENTS = { "EVENT_KEY": "EVENT_VALUE" }
 */
export default {
  subscribe,
  _broadcastEvent,
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

    // console.info(`Subscribing to '${eventName}'.`);
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
function _broadcastEvent(eventName, callbackProps) {
  const hasListeners = Object.keys(this.listeners).length > 0;
  const hasCallbacks = Array.isArray(this.listeners[eventName]);

  if (hasListeners && hasCallbacks) {
    this.listeners[eventName].forEach(listener => {
      listener.callback(callbackProps);
    });
  }
}

/** Export a PubSubService class to be used instead of the individual items */
export class PubSubService {
  EVENTS: any;
  subscribe: (eventName: string, callback: Function) => { unsubscribe: () => any };
  _broadcastEvent: (eventName: string, callbackProps: any) => void;
  _unsubscribe: (eventName: string, listenerId: string) => void;
  _isValidEvent: (eventName: string) => boolean;
  listeners: {};
  unsubscriptions: any[];
  constructor(EVENTS) {
    this.EVENTS = EVENTS;
    this.subscribe = subscribe;
    this._broadcastEvent = _broadcastEvent;
    this._unsubscribe = _unsubscribe;
    this._isValidEvent = _isValidEvent;
    this.listeners = {};
    this.unsubscriptions = [];
  }

  reset() {
    this.unsubscriptions.forEach(unsub => unsub());
    this.unsubscriptions = [];
  }

  /**
   * Creates an event that records whether or not someone
   * has consumed it.  Call eventData.consume() to consume the event.
   * Check eventData.isConsumed to see if it is consumed or not.
   * @param props - to include in the event
   */
  protected createConsumableEvent(props) {
    return {
      ...props,
      isConsumed: false,
      consume: function Consume() {
        this.isConsumed = true;
      },
    };
  }
}
