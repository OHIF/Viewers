/** Internal imports */
import log from '../../log';
import guid from '../../utils/guid';
import pubSubServiceInterface from '../_shared/pubSubServiceInterface';

/**
 * Measurement source schema
 *
 * @typedef {Object} MeasurementSource
 * @property {number} id -
 * @property {string} name -
 * @property {string} version -
 */

/**
 * Measurement schema
 *
 * @typedef {Object} Measurement
 * @property {number} id -
 * @property {string} SOPInstanceUID -
 * @property {string} FrameOfReferenceUID -
 * @property {string} referenceSeriesUID -
 * @property {string} label -
 * @property {string} description -
 * @property {string} type -
 * @property {string} unit -
 * @property {number} area -
 * @property {Array} points -
 * @property {MeasurementSource} source -
 */

/* Measurement schema keys for object validation. */
const MEASUREMENT_SCHEMA_KEYS = [
  'id',
  'SOPInstanceUID',
  'FrameOfReferenceUID',
  'referenceStudyUID',
  'referenceSeriesUID',
  'label',
  'description',
  'type',
  'unit',
  'area', // TODO: Add concept names instead (descriptor)
  'mean',
  'stdDev',
  'length',
  'shortestDiameter',
  'longestDiameter',
  'text', // NOTE: There is nothing like this in SR.
  'points',
  'source',
];

const EVENTS = {
  MEASUREMENT_UPDATED: 'event::measurement_updated',
  INTERNAL_MEASUREMENT_UPDATED: 'event:internal_measurement_updated',
  MEASUREMENT_ADDED: 'event::measurement_added',
  RAW_MEASUREMENT_ADDED: 'event::raw_measurement_added',
  MEASUREMENT_REMOVED: 'event::measurement_removed',
  MEASUREMENTS_CLEARED: 'event::measurements_cleared',
  JUMP_TO_MEASUREMENT: 'event:jump_to_measurement',
};

const VALUE_TYPES = {
  POLYLINE: 'value_type::polyline',
  POINT: 'value_type::point',
  BIDIRECTIONAL: 'value_type::shortAxisLongAxis', // TODO -> Discuss with Danny. => just using SCOORD values isn't enough here.
  ELLIPSE: 'value_type::ellipse',
  MULTIPOINT: 'value_type::multipoint',
  CIRCLE: 'value_type::circle',
};

class MeasurementService {
  constructor() {
    this.sources = {};
    this.mappings = {};
    this.measurements = {};
    this.listeners = {};
    this._jumpToMeasurementCache = {};
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

    Object.assign(this, pubSubServiceInterface);
  }

  /**
   * Get all measurements.
   *
   * @return {Measurement[]} Array of measurements
   */
  getMeasurements() {
    const measurements = this._arrayOfObjects(this.measurements);
    return (
      measurements &&
      measurements.map(m => this.measurements[Object.keys(m)[0]])
    );
  }

  /**
   * Get specific measurement by its id.
   *
   * @param {string} id Id of the measurement
   * @return {Measurement} Measurement instance
   */
  getMeasurement(id) {
    let measurement = null;
    const measurements = this.measurements[id];

    if (measurements && Object.keys(measurements).length > 0) {
      measurement = this.measurements[id];
    }

    return measurement;
  }

  /**
   * Create a new source.
   *
   * @param {string} name Name of the source
   * @param {string} version Source name
   * @return {MeasurementSource} Measurement source instance
   */
  createSource(name, version) {
    if (!name) {
      throw new Error('Source name not provided.');
    }

    if (!version) {
      throw new Error('Source version not provided.');
    }

    const id = guid();
    const source = {
      id,
      name,
      version,
    };
    source.addOrUpdate = (definition, measurement) => {
      return this.addOrUpdate(source, definition, measurement);
    };
    source.remove = id => {
      return this.remove(id, source);
    };
    source.getAnnotation = (definition, measurementId) => {
      return this.getAnnotation(source, definition, measurementId);
    };

    log.info(`New '${name}@${version}' source added.`);
    this.sources[id] = source;

    return source;
  }

  getSource(name, version) {
    const { sources } = this;
    const id = this._getSourceId(name, version);

    return sources[id];
  }

  getSourceMappings(name, version) {
    const { mappings } = this;
    const id = this._getSourceId(name, version);

    return mappings[id];
  }

  _getSourceId(name, version) {
    const { sources } = this;

    const sourceId = Object.keys(sources).find(sourceId => {
      const source = sources[sourceId];

      return source.name === name && source.version === version;
    });

    return sourceId;
  }

  /**
   * Add a new measurement matching criteria along with mapping functions.
   *
   * @param {MeasurementSource} source Measurement source instance
   * @param {string} definition Definition of the measurement (Annotation Type)
   * @param {MatchingCriteria} matchingCriteria The matching criteria
   * @param {Function} toSourceSchema Mapping function to source schema
   * @param {Function} toMeasurementSchema Mapping function to measurement schema
   * @return void
   */
  addMapping(
    source,
    definition,
    matchingCriteria,
    toSourceSchema,
    toMeasurementSchema
  ) {
    if (!this._isValidSource(source)) {
      throw new Error('Invalid source.');
    }

    if (!matchingCriteria) {
      throw new Error('Matching criteria not provided.');
    }

    if (!definition) {
      throw new Error('Definition not provided.');
    }

    if (!toSourceSchema) {
      throw new Error('Mapping function to source schema not provided.');
    }

    if (!toMeasurementSchema) {
      throw new Error('Measurement mapping function not provided.');
    }

    const mapping = {
      matchingCriteria,
      definition,
      toSourceSchema,
      toMeasurementSchema,
    };

    if (Array.isArray(this.mappings[source.id])) {
      this.mappings[source.id].push(mapping);
    } else {
      this.mappings[source.id] = [mapping];
    }

    log.info(
      `New measurement mapping added to source '${this._getSourceInfo(
        source
      )}'.`
    );
  }

  /**
   * Get annotation for specific source.
   *
   * @param {MeasurementSource} source Measurement source instance
   * @param {string} definition The source definition
   * @param {string} measurementId The measurement service measurement id
   * @return {Object} Source measurement schema
   */
  getAnnotation(source, definition, measurementId) {
    if (!this._isValidSource(source)) {
      log.warn('Invalid source. Exiting early.');
      return;
    }

    if (!definition) {
      log.warn('No source definition provided. Exiting early.');
      return;
    }

    const mapping = this._getMappingByMeasurementSource(
      measurementId,
      definition
    );
    const measurement = this.getMeasurement(measurementId);
    if (mapping) return mapping.toSourceSchema(measurement, definition);

    const matchingMapping = this._getMatchingMapping(
      source,
      definition,
      measurement
    );

    if (matchingMapping) {
      log.info('Matching mapping found:', matchingMapping);
      const { toSourceSchema, definition } = matchingMapping;
      return toSourceSchema(measurement, definition);
    }
  }

  update(id, measurement, notYetUpdatedAtSource = false) {
    if (this.measurements[id]) {
      const updatedMeasurement = {
        ...measurement,
        modifiedTimestamp: Math.floor(Date.now() / 1000),
      };

      log.info(
        `Updating internal measurement representation...`,
        updatedMeasurement
      );

      this.measurements[id] = updatedMeasurement;

      this.publish(
        // Add an internal flag to say the measurement has not yet been updated at source.
        this.EVENTS.MEASUREMENT_UPDATED,
        {
          source: measurement.source,
          measurement: updatedMeasurement,
          notYetUpdatedAtSource,
        }
      );

      return updatedMeasurement.id;
    }
  }

  /**
   * Add a raw measurement into a source so that it may be
   * Converted to/from annotation in the same way. E.g. import serialized data
   * Of the same form as the measurement source.
   * @param {MeasurementSource} source The measurement source instance.
   * @param {string} definition The source definition you want to add the measurement to.
   * @param {object} data The data you wish to add to the source.
   * @param {function} toMeasurementSchema A function to get the `data` into the same shape as the source definition.
   */
  addRawMeasurement(
    source,
    definition,
    data,
    toMeasurementSchema,
    dataSource = {}
  ) {
    if (!this._isValidSource(source)) {
      log.warn('Invalid source. Exiting early.');
      return;
    }

    const sourceInfo = this._getSourceInfo(source);

    if (!definition) {
      log.warn('No source definition provided. Exiting early.');
      return;
    }

    if (!this._sourceHasMappings(source)) {
      log.warn(
        `No measurement mappings found for '${sourceInfo}' source. Exiting early.`
      );
      return;
    }

    let measurement = {};
    try {
      /* Convert measurement */
      measurement = toMeasurementSchema(data);
      /* Assign measurement source instance */
      measurement.source = source;
    } catch (error) {
      log.warn(
        `Failed to map '${sourceInfo}' measurement for definition ${definition}:`,
        error.message
      );
      return;
    }

    if (!this._isValidMeasurement(measurement)) {
      log.warn(
        `Attempting to add or update a invalid measurement provided by '${sourceInfo}'. Exiting early.`
      );
      return;
    }

    let internalId = data.id;
    if (!internalId) {
      internalId = guid();
      log.warn(`Measurement ID not found. Generating UID: ${internalId}`);
    }

    const newMeasurement = {
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      id: internalId,
    };

    if (this.measurements[internalId]) {
      log.info(
        `Measurement already defined. Updating measurement.`,
        newMeasurement
      );
      this.measurements[internalId] = newMeasurement;
      this.publish(this.EVENTS.MEASUREMENT_UPDATED, {
        source,
        measurement: newMeasurement,
      });
    } else {
      log.info(`Measurement added.`, newMeasurement);
      this.measurements[internalId] = newMeasurement;
      this.publish(this.EVENTS.RAW_MEASUREMENT_ADDED, {
        source,
        measurement: newMeasurement,
        data,
        dataSource,
      });
    }

    return newMeasurement.id;
  }

  /**
   * Adds or update persisted measurements.
   *
   * @param {MeasurementSource} source The measurement source instance
   * @param {string} definition The source definition
   * @param {Measurement} measurement The source measurement
   * @return {string} A measurement id
   */
  addOrUpdate(source, definition, sourceMeasurement) {
    if (!this._isValidSource(source)) {
      throw new Error('Invalid source.');
    }

    if (!definition) {
      throw new Error('No source definition provided.');
    }

    const sourceInfo = this._getSourceInfo(source);

    if (!this._sourceHasMappings(source)) {
      throw new Error(
        `No measurement mappings found for '${sourceInfo}' source. Exiting early.`
      );
    }

    let measurement = {};
    try {
      const sourceMappings = this.mappings[source.id];
      const { toMeasurementSchema } = sourceMappings.find(
        mapping => mapping.definition === definition
      );

      /* Convert measurement */
      measurement = toMeasurementSchema(sourceMeasurement);

      /* Assign measurement source instance */
      measurement.source = source;
    } catch (error) {
      throw new Error(
        `Failed to map '${sourceInfo}' measurement for definition ${definition}:`,
        error.message
      );
    }

    if (!this._isValidMeasurement(measurement)) {
      throw new Error(
        `Attempting to add or update a invalid measurement provided by '${sourceInfo}'. Exiting early.`
      );
    }

    let internalId = sourceMeasurement.id;
    if (!internalId) {
      internalId = guid();
      log.info(`Measurement ID not found. Generating UID: ${internalId}`);
    }

    const newMeasurement = {
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      id: internalId,
    };

    if (this.measurements[internalId]) {
      log.info(
        `Measurement already defined. Updating measurement.`,
        newMeasurement
      );
      this.measurements[internalId] = newMeasurement;
      this.publish(this.EVENTS.MEASUREMENT_UPDATED, {
        source,
        measurement: newMeasurement,
        notYetUpdatedAtSource: false,
      });
    } else {
      log.info('Measurement added.', newMeasurement);
      this.measurements[internalId] = newMeasurement;
      this.publish(this.EVENTS.MEASUREMENT_ADDED, {
        source,
        measurement: newMeasurement,
      });
    }

    return newMeasurement.id;
  }

  /**
   * Removes a measurement and broadcasts the removed event.
   *
   * @param {string} id The measurement id
   * @param {MeasurementSource} source The measurement source instance
   * @return {string} The removed measurement id
   */
  remove(id, source) {
    if (!id || !this.measurements[id]) {
      log.warn(`No id provided, or unable to find measurement by id.`);
      return;
    }

    delete this.measurements[id];
    this.publish(this.EVENTS.MEASUREMENT_REMOVED, {
      source,
      measurement: id, // This is weird :shrug:
    });
  }

  clearMeasurements() {
    this.measurements = {};
    this._jumpToMeasurementCache = {};
    this.publish(this.EVENTS.MEASUREMENTS_CLEARED);
  }

  jumpToMeasurement(viewportIndex, id) {
    const measurement = this.measurements[id];

    if (!measurement) {
      log.warn(`No id provided, or unable to find measurement by id.`);
      return;
    }

    this._addJumpToMeasurement(viewportIndex, id);

    const eventName = this.EVENTS.JUMP_TO_MEASUREMENT;

    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[eventName].forEach(listener => {
        listener.callback({ viewportIndex, measurement });
      });
    }
  }

  _addJumpToMeasurement(viewportIndex, id) {
    this._jumpToMeasurementCache[viewportIndex] = id;
  }

  getJumpToMeasurement(viewportIndex) {
    return this._jumpToMeasurementCache[viewportIndex];
  }

  removeJumpToMeasurement(viewportIndex) {
    delete this._jumpToMeasurementCache[viewportIndex];
  }

  _getMappingByMeasurementSource(measurementId, definition) {
    const measurement = this.getMeasurement(measurementId);
    if (this._isValidSource(measurement.source)) {
      return this.mappings[measurement.source.id].find(
        m => m.definition === definition
      );
    }
  }

  /**
   * Clear all measurements and broadcasts cleared event.
   */
  clear() {
    this.measurements = {};
    this.publish(this.EVENTS.MEASUREMENTS_CLEARED);
  }

  /**
   * Get measurement mapping function if matching criteria.
   *
   * @param {MeasurementSource} source Measurement source instance
   * @param {string} definition The source definition
   * @param {Measurement} measurement The measurement service measurement
   * @return {Object} The mapping based on matched criteria
   */
  _getMatchingMapping(source, definition, measurement) {
    const sourceMappings = this.mappings[source.id];

    const sourceMappingsByDefinition = sourceMappings.filter(
      mapping => mapping.definition === definition
    );

    /* Criteria Matching */
    return sourceMappingsByDefinition.find(({ matchingCriteria }) => {
      if (matchingCriteria.type !== measurement.type) {
        return false;
      }

      if (
        matchingCriteria.properties &&
        matchingCriteria.properties.every(name =>
          measurement.hasOwnProperty(name)
        )
      ) {
        return true;
      }

      if (
        measurement.points &&
        measurement.points.length === matchingCriteria.points
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Returns formatted string with source info.
   *
   * @param {MeasurementSource} source Measurement source
   * @return {string} Source information
   */
  _getSourceInfo(source) {
    return `${source.name}@${source.version}`;
  }

  /**
   * Checks if given source is valid.
   *
   * @param {MeasurementSource} source Measurement source
   * @return {boolean} Measurement source validation
   */
  _isValidSource(source) {
    return source && this.sources[source.id];
  }

  /**
   * Checks if a given source has mappings.
   *
   * @param {MeasurementSource} source The measurement source
   * @return {boolean} Validation if source has mappings
   */
  _sourceHasMappings(source) {
    return (
      Array.isArray(this.mappings[source.id]) && this.mappings[source.id].length
    );
  }

  /**
   * Check if a given measurement data is valid.
   *
   * @param {Measurement} measurementData Measurement data
   * @return {boolean} Measurement validation
   */
  _isValidMeasurement(measurementData) {
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
   * @param {string} eventName The name of the event
   * @return {boolean} Event name validation
  //  */
  // _isValidEvent(eventName) {
  //   return Object.values(this.EVENTS).includes(eventName);
  // }

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
