/**
 * Publisher allows applying pub-sub by extending it in other classes definition
 */
export default class Publisher {
  constructor() {
    this.subscriptions = new Map();
  }

  /**
   * Triggers a publication for the given subscription key.
   * It will run the callbacks for all subscribers with the provided value.
   * The subscribers' callbacks will be called in the order they were defined.
   *
   * @param {String} key Subscription key
   * @param {any} value Value that will be send to all subscribers
   */
  publish(key, value) {
    const subscriptions = this.subscriptions.get(key);
    if (subscriptions) {
      subscriptions.forEach(callback => callback(value));
    }
  }

  /**
   * Subscribe to a specific key, providing a callback that will run when the
   * publish occurs.
   *
   * @param {String} key Subscription key
   * @param {Function} callback Callback that will be registered for the key
   */
  subscribe(key, callback) {
    if (!this.subscriptions.get(key)) {
      this.subscriptions.set(key, [callback]);
    } else {
      this.subscriptions.get(key).push(callback);
    }
  }

  /**
   * Remove the subscription for the given key and callback, so the callback
   * will no longer run if a publish to key occurs.
   *
   * @param {String} key Subscription key
   * @param {Function} callback Callback that was registered for the key
   */
  unsubscribe(key, callback) {
    const subscriptions = this.subscriptions.get(key);
    const index = subscriptions.indexOf(callback);
    if (index > -1) {
      subscriptions.splice(index, 1);
    }
  }
}
