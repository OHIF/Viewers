import guid from '../../utils/guid';
import debounce from '../../utils/debounce';

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
    this.listeners[eventName] = listeners.filter(({ id, callback }) => {
      callback?.clearDebounceTimeout?.();
      return id !== listenerId;
    });
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

  const event = new CustomEvent(eventName, { detail: callbackProps });
  document.body.dispatchEvent(event);

  if (hasListeners && hasCallbacks) {
    this.listeners[eventName].forEach(listener => {
      listener.callback(callbackProps);
    });
  }
}

/** Export a PubSubService class to be used instead of the individual items */
export class PubSubService {
  EVENTS: Record<string, string>;
  subscribe: (eventName: string, callback: (data: unknown) => void) => { unsubscribe: () => void };
  _broadcastEvent: (eventName: string, callbackProps: unknown) => void;
  _unsubscribe: (eventName: string, listenerId: string) => void;
  _isValidEvent: (eventName: string) => boolean;
  listeners: Record<string, Array<{ id: string; callback: (data: unknown) => void }> | undefined>;
  unsubscriptions: Array<() => void>;
  constructor(EVENTS: Record<string, string>) {
    this.EVENTS = EVENTS;
    this.subscribe = subscribe;
    this._broadcastEvent = _broadcastEvent;
    this._unsubscribe = _unsubscribe;
    this._isValidEvent = _isValidEvent;
    this.listeners = {};
    this.unsubscriptions = [];
  }

  /**
   * Subscribe to updates with debouncing to limit callback execution frequency
   * @param eventName - The name of the event
   * @param callback - Events callback
   * @param wait - Debounce wait time in milliseconds
   * @param immediate - If true, trigger on the leading edge instead of trailing
   */
  subscribeDebounced(
    eventName: string,
    callback: (data: unknown) => void,
    wait = 300,
    immediate = false
  ) {
    if (this._isValidEvent(eventName)) {
      const debouncedCallback = debounce(callback, wait, immediate);
      return this.subscribe(eventName, debouncedCallback);
    } else {
      throw new Error(`Event ${eventName} not supported.`);
    }
  }

  reset() {
    this.unsubscriptions.forEach(unsub => unsub());
    this.unsubscriptions = [];

    Object.keys(this.listeners).forEach(eventName =>
      this.listeners[eventName].forEach(({ callback }) => {
        callback?.clearDebounceTimeout?.();
      })
    );
    this.listeners = {};
  }

  /**
   * Creates an event that records whether or not someone
   * has consumed it.  Call eventData.consume() to consume the event.
   * Check eventData.isConsumed to see if it is consumed or not.
   * @param props - to include in the event
   */
  protected createConsumableEvent<T extends Record<string, unknown>>(
    props: T
  ): T & { isConsumed: boolean; consume: () => void } {
    return {
      ...props,
      isConsumed: false,
      consume: function Consume() {
        this.isConsumed = true;
      },
    };
  }
}
