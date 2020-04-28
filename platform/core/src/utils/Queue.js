
export default class Queue {

  constructor(limit) {
    this.limit = limit;
    this.size = 0;
    this.awaiting = null;
  }

  /**
   * Creates a new "proxy" function associated with the current execution queue
   * instance. When the returned function is invoked, the queue limit is checked
   * to make sure the limit of scheduled tasks is repected (throwing an
   * exception when the limit has been reached and before calling the original
   * function). The original function is only invoked after all the previously
   * scheduled tasks have finished executing (their returned promises have
   * resolved/rejected);
   *
   * @param {function} task The function whose execution will be associated
   * with the current Queue instance;
   * @returns {function} The "proxy" function bound to the current Queue
   * instance;
   */
  bind(task) {
    return bind(this, task);
  }

  bindSafe(task, onError) {
    const boundTask = bind(this, task);
    return async function safeTask(...args) {
      try {
        return await boundTask(...args);
      } catch (e) {
        onError(e);
      }
    };
  }
}

/**
 * Utils
 */

function bind(queue, task) {
  const cleaner = clean.bind(null, queue);
  return async function boundTask(...args) {
    if (queue.size >= queue.limit) {
      throw new Error('Queue limit reached');
    }
    const promise = chain(queue.awaiting, task, args);
    queue.awaiting = promise.then(cleaner, cleaner);
    queue.size++;
    return promise;
  };
}

function clean(queue) {
  if (queue.size > 0 && --queue.size === 0) {
    queue.awaiting = null;
  }
}

async function chain(prev, task, args) {
  await prev;
  return task(...args);
}
