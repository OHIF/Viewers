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
 */

class MeasurementService {
  constructor() {
    this.mappings = {};
    this.measurements = {};
    this.listeners = {};
    this.valueTypes = {
      POLYLINE: 'value_type::polyline',
      POINT: 'value_type::point',
      ELLIPSE: 'value_type::ellipse',
      MULTIPOINT: 'value_type::multipoint',
      CIRCLE: 'value_type::circle',
    };
    this.events = {
      MEASUREMENT_UPDATED: 'event::measurement_updated',
      MEASUREMENT_ADDED: 'event::measurement_added',
    };
  }

  /**
   * Get all available value types.
   *
   * @return {Object} value types
   */
  getValueTypes() {
    return this.valueTypes;
  }

  /**
   * Get all available events.
   *
   * @return {Object} events
   */
  getEvents() {
    return this.events;
  }

  /**
   * Get all measurement by context.
   *
   * @param {string} context
   * @return {MeasurementSchema[]} measurements
   */
  getMeasurements(context = 'all') {
    return this._arrayOfObjects(this.measurements[context]);
  }

  /**
   * Get specific measurement by its id or/and context.
   *
   * @param {string} id
   * @param {string} context
   * @return {MeasurementSchema} measurement
   */
  getMeasurement(id, context) {
    if (context) {
      return this.measurements[context][id];
    }

    let measurement = null;
    if (!context) {
      const contexts = Object.keys(this.measurements);
      contexts.forEach(context => {
        const contextMeasurements = this.measurements[context];
        if (Object.keys(contextMeasurements[id]).length > 0) {
          measurement = this.measurements[context][id];
        }
      });
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
   * @param {string} context
   * @return {string} measurement id
   */
  addOrUpdate(sourceName, sourceMeasurement, context = 'all') {
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
        `Attempting to add or update a invalid measurement in '${context}' context. Exiting early.`
      );
      return;
    }

    let internalId = measurement.id;
    if (!internalId) {
      internalId = guid();
      log.warn(`Measurement ID not set in '${context}' context. Using generated UID: ${internalId}`);
    }

    const newMeasurement = {
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      id: internalId,
    };

    /* Create measurements context */
    if (!this.measurements[context]) {
      this.measurements[context] = {};
    }

    /* Create listeners context */
    if (!this.listeners[context]) {
      this.listeners[context] = {};
    }

    if (this.measurements[context][internalId]) {
      log.warn(`Measurement already defined in '${context}' context. Updating measurement.`, newMeasurement);
      this.measurements[context][internalId] = newMeasurement;
      this._broadcastChange(this.events.MEASUREMENT_UPDATED, sourceName, newMeasurement, context);
    } else {
      log.warn(`Measurement added in '${context}' context.`, newMeasurement);
      this.measurements[context][internalId] = newMeasurement;
      this._broadcastChange(this.events.MEASUREMENT_ADDED, sourceName, newMeasurement, context);
    }

    return newMeasurement.id;
  }

  /**
   * Broadcasts measurement changes to a given context.
   *
   * @param {string} measurementId
   * @param {string} eventName
   * @param {string} context
   * @return void
   */
  _broadcastChange(eventName, source, measurement, context) {
    const hasListeners = Object.keys(this.listeners[context]).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[context][eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[context][eventName].forEach(listener => {
        listener.callback({ source, measurement });
      });
    }
  }

  /**
   * Subscribe to measurement updates.
   *
   * @param {string} eventName
   * @param {Function} callback
   * @param {string} context
   * @return {Object} observable actions
   */
  subscribe(eventName, callback, context = 'all') {
    if (this._isValidEvent(eventName)) {
      console.warn(`Subscribing to '${eventName}' event using '${context}' context.`);
      const listenerId = guid();

      /* Create new listeners context if needed */
      if (!this.listeners[context]) {
        this.listeners[context] = {};
      }

      if (Array.isArray(this.listeners[context][eventName])) {
        this.listeners[context][eventName].push({ id: listenerId, callback });
      } else {
        this.listeners[context][eventName] = [{ id: listenerId, callback }];
      }

      return {
        unsubscribe: () => this._unsubscribe(eventName, listenerId, context)
      };
    } else {
      throw new Error(`Event ${eventName} not supported in '${context}' context.`);
    }
  }

  /**
   * Unsubscribe to measurement updates.
   *
   * @param {string} eventName
   * @param {string} listenerId
   * @param {string} context
   * @return void
   */
  _unsubscribe(eventName, listenerId, context) {
    if (!this.listeners[context]) {
      return;
    }

    const listenersOfContext = this.listeners[context][eventName];
    if (Array.isArray(listenersOfContext)) {
      this.listeners[context][eventName] = listenersOfContext.filter(
        ({ id }) => id !== listenerId
      );
    } else {
      this.listeners[context][eventName] = undefined;
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
    return Object.values(this.events).includes(eventName);
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
