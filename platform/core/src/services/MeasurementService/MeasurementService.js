/**
 * A measurement
 *
 * @typedef {Object} MeasurementSchema
 * @property {string} id
 * @property {Object} data
 */

const name = 'MeasurementService';

const publicAPI = {
  name,
  addOrUpdate: _addOrUpdate,
  subscribe: _subscribe,
  setServiceImplementation,
};

const serviceImplementation = {
  _subscribe: () => console.warn('subscribe() NOT IMPLEMENTED'),
  _addOrUpdate: () => console.warn('addOrUpdate() NOT IMPLEMENTED'),
};

/**
 * Adds or update persisted measurements.
 *
 * @param {MeasurementSchema} schema { id, annotation }
 */
function _addOrUpdate({ id, annotation }) {
  return serviceImplementation._addOrUpdate({ id, annotation });
}

/**
 * Subscribe to measurement changes.
 *
 * @param {string} eventName
 * @param {Function} callback
 */
function _subscribe(eventName, callback) {
  return serviceImplementation._subscribe(eventName, callback);
}

/**
 *
 *
 * @param {*} {
 *   addOrUpdate: addOrUpdateImplementation,
 *   subscribe: subscribeImplementation,
 * }
 */
function setServiceImplementation({
  addOrUpdate: addOrUpdateImplementation,
  subscribe: subscribeImplementation,
}) {
  if (addOrUpdateImplementation) {
    serviceImplementation._addOrUpdate = addOrUpdateImplementation;
  }
  if (subscribeImplementation) {
    serviceImplementation._subscribe = subscribeImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
