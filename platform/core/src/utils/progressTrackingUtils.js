import makeDeferred from './makeDeferred';

/**
 * Constants
 */

const TYPE = Symbol('Type');
const TASK = Symbol('Task');
const LIST = Symbol('List');

/**
 * Public Methods
 */

/**
 * Creates an instance of a task list
 * @returns {Object} A task list object
 */
function createList() {
  return objectWithType(LIST, {
    head: null,
    named: Object.create(null),
    observers: [],
  });
}

/**
 * Checks if the given argument is a List instance
 * @param {any} subject The value to be tested
 * @returns {boolean} true if a valid List instance is given, false otherwise
 */
function isList(subject) {
  return isOfType(LIST, subject);
}

/**
 * Creates an instance of a task
 * @param {Object} list The List instance related to this task
 * @param {Object} next The next Task instance to link to
 * @returns {Object} A task object
 */
function createTask(list, next) {
  return objectWithType(TASK, {
    list: isList(list) ? list : null,
    next: isTask(next) ? next : null,
    failed: false,
    awaiting: null,
    progress: 0.0,
  });
}

/**
 * Checks if the given argument is a Task instance
 * @param {any} subject The value to be tested
 * @returns {boolean} true if a valid Task instance is given, false otherwise
 */
function isTask(subject) {
  return isOfType(TASK, subject);
}

/**
 * Appends a new Task to the given List instance and notifies the list observers
 * @param {Object} list A List instance
 * @returns {Object} The new Task instance appended to the List or null if the
 *  given List instanc is not valid
 */
function increaseList(list) {
  if (isList(list)) {
    const task = createTask(list, list.head);
    list.head = task;
    notify(list, getOverallProgress(list));
    return task;
  }
  return null;
}

/**
 * Updates the internal progress value of the given Task instance and notifies
 * the observers of the associated list.
 * @param {Object} task The Task instance to be updated
 * @param {number} value A number between 0 (inclusive) and 1 (exclusive)
 *  indicating the progress of the task;
 * @returns {void} Nothing is returned
 */
function update(task, value) {
  if (isTask(task) && isValidProgress(value) && value < 1.0) {
    if (task.progress !== value) {
      task.progress = value;
      if (isList(task.list)) {
        notify(task.list, getOverallProgress(task.list));
      }
    }
  }
}

/**
 * Sets a Task instance as finished (progress = 1.0), freezes it in order to
 * prevent further modifications and notifies the observers of the associated
 * list.
 * @param {Object} task The Task instance to be finalized
 * @returns {void} Nothing is returned
 */
function finish(task) {
  if (isTask(task)) {
    task.progress = 1.0;
    task.awaiting = null;
    Object.freeze(task);
    if (isList(task.list)) {
      notify(task.list, getOverallProgress(task.list));
    }
  }
}

/**
 * Generate a summarized snapshot of the current status of the given task List
 * @param {Object} list The List instance to be scanned
 * @returns {Object} An object representing the summarized status of the list
 */
function getOverallProgress(list) {
  const status = createStatus();
  if (isList(list)) {
    let task = list.head;
    while (isTask(task)) {
      status.total++;
      if (isValidProgress(task.progress)) {
        status.partial += task.progress;
        if (task.progress === 1.0 && task.failed) {
          status.failures++;
        }
      }
      task = task.next;
    }
  }
  if (status.total > 0) {
    status.progress = status.partial / status.total;
  }
  return Object.freeze(status);
}

/**
 * Adds a Task instance to the given list that waits on a given "thenable". When
 * the thenable resolves the "finish" method is called on the newly created
 * instance thus notifying the observers of the list.
 * @param {Object} list The List instance to which the new task will be added
 * @param {Object|Promise} thenable The thenable to be waited on
 * @returns {Object} A reference to the newly created Task;
 */
function waitOn(list, thenable) {
  const task = increaseList(list);
  if (isTask(task)) {
    task.awaiting = Promise.resolve(thenable).then(
      function () {
        finish(task);
      },
      function () {
        task.failed = true;
        finish(task);
      }
    );
    return task;
  }
  return null;
}

/**
 * Adds a Task instance to the given list using a deferred (a Promise that can
 * be externally resolved) notifying the observers of the list.
 * @param {Object} list The List instance to which the new task will be added
 * @returns {Object} An object with references to the created deferred and task
 */
function addDeferred(list) {
  const deferred = makeDeferred();
  const task = waitOn(list, deferred.promise);
  return Object.freeze({
    deferred,
    task,
  });
}

/**
 * Assigns a name to a specific task of the list
 * @param {Object} list The List instance whose task will be named
 * @param {Object} task The specified Task instance
 * @param {string} name The name of the task
 * @returns {boolean} Returns true on success, false otherwise
 */
function setTaskName(list, task, name) {
  if (
    contains(list, task) &&
    list.named !== null &&
    typeof list.named === 'object' &&
    typeof name === 'string'
  ) {
    list.named[name] = task;
    return true;
  }
  return false;
}

/**
 * Retrieves a task by name
 * @param {Object} list The List instance whose task will be retrieved
 * @param {string} name The name of the task to be retrieved
 * @returns {Object} The Task instance or null if not found
 */
function getTaskByName(list, name) {
  if (
    isList(list) &&
    list.named !== null &&
    typeof list.named === 'object' &&
    typeof name === 'string'
  ) {
    const task = list.named[name];
    if (isTask(task)) {
      return task;
    }
  }
  return null;
}

/**
 * Adds an observer (callback function) to a given List instance
 * @param {Object} list The List instance to which the observer will be appended
 * @param {Function} observer The observer (function) that will be executed
 *  every time a change happens within the list
 * @returns {boolean} Returns true on success and false otherwise
 */
function addObserver(list, observer) {
  if (isList(list) && Array.isArray(list.observers) && typeof observer === 'function') {
    list.observers.push(observer);
    return true;
  }
  return false;
}

/**
 * Removes an observer (callback function) from a given List instance
 * @param {Object} list The instance List from which the observer will removed
 * @param {Function} observer The observer function to be removed
 * @returns {boolean} Returns true on success and false otherwise
 */
function removeObserver(list, observer) {
  if (isList(list) && Array.isArray(list.observers) && list.observers.length > 0) {
    const index = list.observers.indexOf(observer);
    if (index >= 0) {
      list.observers.splice(index, 1);
      return true;
    }
  }
  return false;
}

/**
 * Utils
 */

function createStatus() {
  return Object.seal({
    total: 0,
    partial: 0.0,
    progress: 0.0,
    failures: 0,
  });
}

function objectWithType(type, object) {
  return Object.seal(Object.defineProperty(object, TYPE, { value: type }));
}

function isOfType(type, subject) {
  return subject !== null && typeof subject === 'object' && subject[TYPE] === type;
}

function isValidProgress(value) {
  return typeof value === 'number' && value >= 0.0 && value <= 1.0;
}

function contains(list, task) {
  if (isList(list) && isTask(task)) {
    let item = list.head;
    while (isTask(item)) {
      if (item === task) {
        return true;
      }
      item = item.next;
    }
  }
  return false;
}

function notify(list, data) {
  if (isList(list) && Array.isArray(list.observers) && list.observers.length > 0) {
    list.observers.slice().forEach(function (observer) {
      if (typeof observer === 'function') {
        try {
          observer(data, list);
        } catch (e) {
          /* Oops! */
        }
      }
    });
  }
}

/**
 * Exports
 */

const progressTrackingUtils = {
  createList,
  isList,
  createTask,
  isTask,
  increaseList,
  update,
  finish,
  getOverallProgress,
  waitOn,
  addDeferred,
  setTaskName,
  getTaskByName,
  addObserver,
  removeObserver,
};

export default progressTrackingUtils;
