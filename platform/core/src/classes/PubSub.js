const _subscriptions = Symbol('subscriptions');
const _lastSubscriptionId = Symbol('lastSubscriptionId');

/**
 * Class to implement publish/subscribe pattern
 *
 * @class
 * @classdesc Pub/sub mechanism
 */
export default class PubSub {
  constructor() {
    this[_subscriptions] = {};
    this[_lastSubscriptionId] = 0;
  }

  /**
   * Subscribe to event
   *
   * @param {string} eventName Event name
   * @param {Function} callback Callback function
   * @returns {void}
   */
  subscribe(eventName, callback) {
    if (eventName === undefined) {
      throw new Error('Event name is required');
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this[_subscriptions].hasOwnProperty(eventName)) {
      this[_subscriptions][eventName] = {};
    }

    const subscriptionId = `sub${this[_lastSubscriptionId]++}`;
    this[_subscriptions][eventName][subscriptionId] = callback;
  }

  /**
   * Removes a subscription
   *
   * @param {string} eventName Event name
   * @param {Function} [callback] Callback function
   * @returns {void}
   */
  unsubscribe(eventName, callback) {
    const callbacks = this[_subscriptions][eventName] || {};
    for (let subscriptionId in callbacks) {
      if (!callback) {
        delete callbacks[subscriptionId];
      } else if (callbacks[subscriptionId] === callback) {
        delete callbacks[subscriptionId];
      }
    }
  }

  /**
   * Publish event to all subscriptions
   *
   * @param {String} eventName Event name
   * @param {any} [payload] Data that will be published
   * @returns {void}
   */
  publish(eventName, ...payload) {
    if (eventName === undefined) {
      throw new Error('Event name is required');
    }

    const callbacks = this[_subscriptions][eventName] || {};
    for (let subscriptionId in callbacks) {
      callbacks[subscriptionId](...payload);
    }
  }
}
