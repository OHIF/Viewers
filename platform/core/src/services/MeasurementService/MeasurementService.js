import log from '../../log';
import guid from '../../utils/guid';

/**
 * Measurement schema
 *
 * @typedef {Object} MeasurementSchema
 * @property {number} id -
 * @property {string} sopInstanceUID -
 * @property {string} frameOfReferenceUID -
 * @property {string} referenceSeriesUID -
 * @property {string} label -
 * @property {string} description -
 * @property {string} type -
 * @property {string} unit -
 * @property {number} area -
 * @property {Array} points -
 * @property {string} source -
 * @property {string} sourceToolType -
 * @property {string} sourceVersion -
 */

const EVENTS = {
  MEASUREMENT_UPDATED: 'event::measurement_updated',
  MEASUREMENT_ADDED: 'event::measurement_added',
};

const VALUE_TYPES = {
  POLYLINE: 'value_type::polyline',
  POINT: 'value_type::point',
  ELLIPSE: 'value_type::ellipse',
  MULTIPOINT: 'value_type::multipoint',
  CIRCLE: 'value_type::circle',
};

class MeasurementService {
  constructor() {
    this.mappings = {};
    this.measurements = {};
    this.listeners = {};
    Object.defineProperty(this, 'EVENTS', {
      value: EVENTS,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(this, 'VALUE_TYPES', {
      value: VALUE_TYPES,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  /**
   * Get all measurements.
   *
   * @return {MeasurementSchema[]} measurements
   */
  getMeasurements() {
    return this._arrayOfObjects(this.measurements);
  }

  /**
   * Get specific measurement by its id.
   *
   * @param {string} id
   * @return {MeasurementSchema} measurement
   */
  getMeasurement(id) {
    let measurement = null;
    if (Object.keys(this.measurements[id]).length > 0) {
      measurement = this.measurements[id];
    }
    return measurement;
  }

  /**
   * Add a new measurement matching criteria along with mapping functions.
   *
   * @return void
   */
  addMapping(
    sourceName,
    matchingCriteria,
    toSourceSchema,
    toMeasurementSchema
  ) {
    if (!sourceName) {
      log.warn('Source name not provided. Exiting early.');
      return;
    }

    if (!matchingCriteria) {
      log.warn('Matching criteria not provided. Exiting early.');
      return;
    }

    if (!toSourceSchema) {
      log.warn('Source mapping function not provided. Exiting early.');
      return;
    }

    if (!toMeasurementSchema) {
      log.warn('Measurement mapping function not provided. Exiting early.');
      return;
    }

    const mapping = { matchingCriteria, toSourceSchema, toMeasurementSchema };

    if (Array.isArray(this.mappings[sourceName])) {
      this.mappings[sourceName].push(mapping);
    } else {
      this.mappings[sourceName] = [mapping];
    }

    log.warn(`New '${sourceName}' measurement mapping added.`);
  }

  getAnnotation(sourceName, measurementId) {
    const measurement = this.getMeasurement(measurementId);
    const sourceMappings = this.mappings[sourceName];
    const matchedCriteriaMapping = sourceMappings.find(({ matchingCriteria }) => {
      return measurement.points && measurement.points.length === matchingCriteria.points;
    });

    if (matchedCriteriaMapping) {
      return {
        measurement,
        annotation: matchedCriteriaMapping.toSourceSchema(measurement),
      };
    }

    return null;
  }

  /**
   * Adds or update persisted measurements.
   *
   * @param {MeasurementSchema} measurement
   * @return {string} measurement id
   */
  addOrUpdate(sourceName, sourceMeasurement) {
    if (!sourceName) {
      log.warn(`No measurement source name provided. Exiting early.`);
      return;
    }

    if (!(Array.isArray(this.mappings[sourceName]) && this.mappings[sourceName].length)) {
      log.warn(`No measurement mappings found for '${sourceName}' source name. Exiting early.`);
      return;
    }

    let measurement = {};
    try {
      const sourceMappings = this.mappings[sourceName];
      const { matchingCriteria } = sourceMappings.find(({ matchingCriteria, toMeasurementSchema }) => {

        try {
          measurement = toMeasurementSchema(sourceMeasurement);
        } catch (error) {
          log.error(error.message);
        }

        return measurement.points && measurement.points.length === matchingCriteria.points;
      });

      if (!matchingCriteria) {
        log.warn(`No matching criterias for measurement.`);
        return;
      }

      measurement.type = matchingCriteria.valueType;
    } catch (error) {
      log.error(`Failed to map '${sourceName}' measurement to measurement service format:`, error.message);
      return;
    }

    if (!this._isValidMeasurement(measurement)) {
      log.warn(
        `Attempting to add or update a invalid measurement provided by '${sourceName}'. Exiting early.`
      );
      return;
    }

    let internalId = measurement.id;
    if (!internalId) {
      internalId = guid();
      log.warn(`Measurement ID not set previously. Using generated UID: ${internalId}`);
    }

    const newMeasurement = {
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      id: internalId,
    };

    if (this.measurements[internalId]) {
      log.warn(`Measurement already defined. Updating measurement.`, newMeasurement);
      this.measurements[internalId] = newMeasurement;
      this._broadcastChange(this.EVENTS.MEASUREMENT_UPDATED, sourceName, newMeasurement);
    } else {
      log.warn(`Measurement added.`, newMeasurement);
      this.measurements[internalId] = newMeasurement;
      this._broadcastChange(this.EVENTS.MEASUREMENT_ADDED, sourceName, newMeasurement);
    }

    return newMeasurement.id;
  }

  /**
   * Subscribe to measurement updates.
   *
   * @param {string} eventName
   * @param {Function} callback
   * @return {Object} observable actions
   */
  subscribe(eventName, callback) {
    if (this._isValidEvent(eventName)) {
      console.warn(`Subscribing to '${eventName}'.`);
      const listenerId = guid();

      const subscription = { id: listenerId, callback };
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
   * Broadcasts measurement changes.
   *
   * @param {string} measurementId
   * @param {string} eventName
   * @return void
   */
  _broadcastChange(eventName, source, measurement) {
    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[eventName].forEach(listener => {
        listener.callback({ source, measurement });
      });
    }
  }

  /**
   * Unsubscribe to measurement updates.
   *
   * @param {string} eventName
   * @param {string} listenerId
   * @return void
   */
  _unsubscribe(eventName, listenerId) {
    if (!this.listeners[eventName]) {
      return;
    }

    const listeners = this.listeners[eventName];
    if (Array.isArray(listeners)) {
      this.listeners[eventName] = listeners.filter(
        ({ id }) => id !== listenerId
      );
    } else {
      this.listeners[eventName] = undefined;
    }
  }

  /**
   * Check if a given measurement data is valid.
   *
   * @param {MeasurementSchema} measurementData
   * @return {boolean} measurement validation
   */
  _isValidMeasurement(measurementData) {
    const MEASUREMENT_SCHEMA_KEYS = [
      'id',
      'sopInstanceUID',
      'frameOfReferenceUID',
      'referenceSeriesUID',
      'label',
      'description',
      'type',
      'unit',
      'area', // TODO: Add concept names instead (descriptor)
      'points',
      'source',
      'sourceToolType',
      'sourceVersion'
    ];

    Object.keys(measurementData).forEach(key => {
      if (!MEASUREMENT_SCHEMA_KEYS.includes(key)) {
        log.warn(`Invalid measurement key: ${key}`);
        return false;
      }
    });

    return true;
  }

  /**
   * Check if a given measurement service event is valid.
   *
   * @param {string} eventName
   * @return {boolean} event name validation
   */
  _isValidEvent(eventName) {
    return Object.values(this.EVENTS).includes(eventName);
  }

  /**
   * Converts object of objects to array.
   *
   * @return {Array} Array of objects
   */
  _arrayOfObjects = obj => {
    return Object.entries(obj).map(e => ({ [e[0]]: e[1] }));
  };
}

export default MeasurementService;
export { EVENTS, VALUE_TYPES };
