import log from '../../log';
import guid from '../../utils/guid';
import { PubSubService } from '../_shared/pubSubServiceInterface';

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
 * @property {number} uid -
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
 * @property {boolean} selected -
 */

/* Measurement schema keys for object validation. */
const MEASUREMENT_SCHEMA_KEYS = [
  'uid',
  'data',
  'getReport',
  'displayText',
  'SOPInstanceUID',
  'FrameOfReferenceUID',
  'referenceStudyUID',
  'referenceSeriesUID',
  'frameNumber',
  'displaySetInstanceUID',
  'label',
  'description',
  'type',
  'unit',
  'points',
  'source',
  'toolName',
  'metadata',
  // Todo: we shouldn't need to have all these here.
  'area', // TODO: Add concept names instead (descriptor)
  'mean',
  'stdDev',
  'perimeter',
  'length',
  'shortestDiameter',
  'longestDiameter',
  'cachedStats',
  'selected',
  'textBox',
  'referencedImageId',
];

const EVENTS = {
  MEASUREMENT_UPDATED: 'event::measurement_updated',
  INTERNAL_MEASUREMENT_UPDATED: 'event:internal_measurement_updated',
  MEASUREMENT_ADDED: 'event::measurement_added',
  RAW_MEASUREMENT_ADDED: 'event::raw_measurement_added',
  MEASUREMENT_REMOVED: 'event::measurement_removed',
  MEASUREMENTS_CLEARED: 'event::measurements_cleared',
  // Give the viewport a chance to jump to the measurement
  JUMP_TO_MEASUREMENT_VIEWPORT: 'event:jump_to_measurement_viewport',
  // Give the layout a chance to jump to the measurement
  JUMP_TO_MEASUREMENT_LAYOUT: 'event:jump_to_measurement_layout',
};

const VALUE_TYPES = {
  ANGLE: 'value_type::polyline',
  POLYLINE: 'value_type::polyline',
  POINT: 'value_type::point',
  BIDIRECTIONAL: 'value_type::shortAxisLongAxis', // TODO -> Discuss with Danny. => just using SCOORD values isn't enough here.
  ELLIPSE: 'value_type::ellipse',
  RECTANGLE: 'value_type::rectangle',
  MULTIPOINT: 'value_type::multipoint',
  CIRCLE: 'value_type::circle',
  ROI_THRESHOLD: 'value_type::roiThreshold',
  ROI_THRESHOLD_MANUAL: 'value_type::roiThresholdManual',
};

/**
 * MeasurementService class that supports source management and measurement management.
 * Sources can be any library that can provide "annotations" (e.g. cornerstone-tools, cornerstone, etc.)
 * The flow, is that by creating a source and mappings (annotation <-> measurement), we
 * can convert back and forth between the two. MeasurementPanel in OHIF uses the measurement service
 * to manage the measurements, and any edit to the measurements will be reflected back at the
 * library level state (e.g. cornerstone-tools, cornerstone, etc.) by converting the
 * edited measurements back to the original annotations and then updating the annotations.
 *
 * Note and Todo: We should be able to support measurements that are composed of multiple
 * annotations, but that is not the case at the moment.
 */
class MeasurementService extends PubSubService {
  public static REGISTRATION = {
    name: 'measurementService',
    altName: 'MeasurementService',
    create: ({ configuration = {} }) => {
      return new MeasurementService();
    },
  };

  public static readonly EVENTS = EVENTS;
  public static VALUE_TYPES = VALUE_TYPES;
  public readonly VALUE_TYPES = VALUE_TYPES;

  private measurements = new Map();
  private unmappedMeasurements = new Map();

  constructor() {
    super(EVENTS);
    this.sources = {};
    this.mappings = {};
  }

  /**
   * Adds the given schema to the measurement service schema list.
   * This method should be used to add custom tool schema to the measurement service.
   * @param {Array} schema schema for validation
   */
  public addMeasurementSchemaKeys(schema): void {
    if (!Array.isArray(schema)) {
      schema = [schema];
    }

    MEASUREMENT_SCHEMA_KEYS.push(...schema);
  }

  /**
   * Adds the given valueType to the measurement service valueType object.
   * This method should be used to add custom valueType to the measurement service.
   * @param {*} valueType
   * @returns
   */
  addValueType(valueType) {
    if (VALUE_TYPES[valueType]) {
      return;
    }

    // check if valuetype is valid , and if values are strings
    if (!valueType || typeof valueType !== 'object') {
      console.warn(`MeasurementService: addValueType: invalid valueType: ${valueType}`);
      return;
    }

    Object.keys(valueType).forEach(key => {
      if (!VALUE_TYPES[key]) {
        VALUE_TYPES[key] = valueType[key];
      }
    });
  }

  /**
   * Get all measurements.
   *
   * @return {Measurement[]} Array of measurements
   */
  getMeasurements() {
    return [...this.measurements.values()];
  }

  /**
   * Get specific measurement by its uid.
   *
   * @param {string} uid measurement uid
   * @return {Measurement} Measurement instance
   */
  public getMeasurement(measurementUID: string) {
    return this.measurements.get(measurementUID);
  }

  public setMeasurementSelected(measurementUID: string, selected: boolean): void {
    const measurement = this.getMeasurement(measurementUID);
    if (!measurement) {
      return;
    }

    measurement.selected = selected;

    this._broadcastEvent(this.EVENTS.MEASUREMENT_UPDATED, {
      source: measurement.source,
      measurement,
      notYetUpdatedAtSource: false,
    });
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

    // Go over all the keys inside the sources and check if the source
    // name and version matches with the existing sources.
    const sourceKeys = Object.keys(this.sources);

    for (let i = 0; i < sourceKeys.length; i++) {
      const source = this.sources[sourceKeys[i]];
      if (source.name === name && source.version === version) {
        return source;
      }
    }

    const uid = guid();
    const source = {
      uid,
      name,
      version,
    };

    source.annotationToMeasurement = (annotationType, annotation, isUpdate = false) => {
      return this.annotationToMeasurement(source, annotationType, annotation, isUpdate);
    };

    source.remove = (measurementUID, eventDetails) => {
      return this.remove(measurementUID, source, eventDetails);
    };

    source.getAnnotation = (annotationType, measurementId) => {
      return this.getAnnotation(source, annotationType, measurementId);
    };

    log.info(`New '${name}@${version}' source added.`);
    this.sources[uid] = source;

    return source;
  }

  getSource(name, version) {
    const { sources } = this;
    const uid = this._getSourceUID(name, version);

    return sources[uid];
  }

  getSourceMappings(name, version) {
    const { mappings } = this;
    const uid = this._getSourceUID(name, version);

    return mappings[uid];
  }

  /**
   * Add a new measurement matching criteria along with mapping functions.
   *
   * @param {MeasurementSource} source Measurement source instance
   * @param {string} annotationType annotation type to match which can be e.g., Length, Bidirectional, etc.
   * @param {MatchingCriteria} matchingCriteria The matching criteria
   * @param {Function} toAnnotationSchema Mapping function to annotation schema
   * @param {Function} toMeasurementSchema Mapping function to measurement schema
   * @return void
   */
  addMapping(source, annotationType, matchingCriteria, toAnnotationSchema, toMeasurementSchema) {
    if (!this._isValidSource(source)) {
      throw new Error('Invalid source.');
    }

    if (!matchingCriteria) {
      throw new Error('Matching criteria not provided.');
    }

    if (!annotationType) {
      throw new Error('annotationType not provided.');
    }

    if (!toAnnotationSchema) {
      throw new Error('Mapping function to source schema not provided.');
    }

    if (!toMeasurementSchema) {
      throw new Error('Measurement mapping function not provided.');
    }

    const mapping = {
      matchingCriteria,
      annotationType,
      toAnnotationSchema,
      toMeasurementSchema,
    };

    if (Array.isArray(this.mappings[source.uid])) {
      this.mappings[source.uid].push(mapping);
    } else {
      this.mappings[source.uid] = [mapping];
    }

    log.info(`New measurement mapping added to source '${this._getSourceToString(source)}'.`);
  }

  /**
   * Get annotation for specific source.
   *
   * @param {MeasurementSource} source Measurement source instance
   * @param {string} annotationType The source annotationType
   * @param {string} measurementUID The measurement service measurement uid
   * @return {Object} Source measurement schema
   */
  getAnnotation(source, annotationType, measurementUID) {
    if (!this._isValidSource(source)) {
      log.warn('Invalid source. Exiting early.');
      return;
    }

    if (!annotationType) {
      log.warn('No source annotationType provided. Exiting early.');
      return;
    }

    const measurement = this.getMeasurement(measurementUID);
    const mapping = this._getMappingByMeasurementSource(measurement, annotationType);

    if (mapping) {
      return mapping.toAnnotationSchema(measurement, annotationType);
    }

    const matchingMapping = this._getMatchingMapping(source, annotationType, measurement);

    if (matchingMapping) {
      log.info('Matching mapping found:', matchingMapping);
      const { toAnnotationSchema, annotationType } = matchingMapping;
      return toAnnotationSchema(measurement, annotationType);
    }
  }

  update(measurementUID: string, measurement, notYetUpdatedAtSource = false) {
    if (!this.measurements.has(measurementUID)) {
      return;
    }

    const updatedMeasurement = {
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
    };

    log.info(`Updating internal measurement representation...`, updatedMeasurement);

    this.measurements.set(measurementUID, updatedMeasurement);

    this._broadcastEvent(this.EVENTS.MEASUREMENT_UPDATED, {
      source: measurement.source,
      measurement: updatedMeasurement,
      notYetUpdatedAtSource,
    });

    return updatedMeasurement.uid;
  }

  /**
   * Add a raw measurement into a source so that it may be
   * Converted to/from annotation in the same way. E.g. import serialized data
   * of the same form as the measurement source.
   * @param {MeasurementSource} source The measurement source instance.
   * @param {string} annotationType The source annotationType you want to add the measurement to.
   * @param {object} data The data you wish to add to the source.
   * @param {function} toMeasurementSchema A function to get the `data` into the same shape as the source annotationType.
   */
  addRawMeasurement(source, annotationType, data, toMeasurementSchema, dataSource = {}) {
    if (!this._isValidSource(source)) {
      log.warn('Invalid source. Exiting early.');
      return;
    }

    const sourceInfo = this._getSourceToString(source);

    if (!annotationType) {
      log.warn('No source annotationType provided. Exiting early.');
      return;
    }

    if (!this._sourceHasMappings(source)) {
      log.warn(`No measurement mappings found for '${sourceInfo}' source. Exiting early.`);
      return;
    }

    let measurement = {};
    try {
      measurement = toMeasurementSchema(data);
      measurement.source = source;
    } catch (error) {
      log.warn(
        `Failed to map '${sourceInfo}' measurement for annotationType ${annotationType}:`,
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

    let internalUID = data.id;
    if (!internalUID) {
      internalUID = guid();
      log.warn(`Measurement ID not found. Generating UID: ${internalUID}`);
    }

    const annotationData = data.annotation.data;

    const newMeasurement = {
      finding: annotationData.finding,
      findingSites: annotationData.findingSites,
      site: annotationData.findingSites?.[0],
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      uid: internalUID,
    };

    if (this.measurements.get(internalUID)) {
      this.measurements.set(internalUID, newMeasurement);
      this._broadcastEvent(this.EVENTS.MEASUREMENT_UPDATED, {
        source,
        measurement: newMeasurement,
      });
    } else {
      log.info('Measurement added', newMeasurement);
      this.measurements.set(internalUID, newMeasurement);
      this._broadcastEvent(this.EVENTS.RAW_MEASUREMENT_ADDED, {
        source,
        measurement: newMeasurement,
        data,
        dataSource,
      });
    }

    return newMeasurement.uid;
  }

  /**
   * Adds or update persisted measurements.
   *
   * @param {MeasurementSource} source The measurement source instance
   * @param {string} annotationType The source annotationType
   * @param {EventDetail} sourceAnnotationDetail for the annotation event
   * @param {boolean} isUpdate is this an update or an add/completed instead?
   * @return {string} A measurement uid
   */
  annotationToMeasurement(source, annotationType, sourceAnnotationDetail, isUpdate = false) {
    if (!this._isValidSource(source)) {
      throw new Error('Invalid source.');
    }
    if (!annotationType) {
      throw new Error('No source annotationType provided.');
    }

    const sourceInfo = this._getSourceToString(source);

    if (!this._sourceHasMappings(source)) {
      throw new Error(`No measurement mappings found for '${sourceInfo}' source. Exiting early.`);
    }

    let measurement = {};
    try {
      const sourceMappings = this.mappings[source.uid];
      const sourceMapping = sourceMappings.find(
        mapping => mapping.annotationType === annotationType
      );
      if (!sourceMapping) {
        console.log('No source mapping', source);
        return;
      }
      const { toMeasurementSchema } = sourceMapping;

      /* Convert measurement */
      measurement = toMeasurementSchema(sourceAnnotationDetail);
      measurement.source = source;
    } catch (error) {
      // Todo: handle other
      this.unmappedMeasurements.set(sourceAnnotationDetail.uid, {
        ...sourceAnnotationDetail,
        source: {
          name: source.name,
          version: source.version,
          uid: source.uid,
        },
      });

      console.log('Failed to map', error);
      throw new Error(
        `Failed to map '${sourceInfo}' measurement for annotationType ${annotationType}: ${error.message}`
      );
    }

    if (!this._isValidMeasurement(measurement)) {
      throw new Error(
        `Attempting to add or update a invalid measurement provided by '${sourceInfo}'. Exiting early.`
      );
    }

    // Todo: we are using uid on the eventDetail, it should be uid of annotation
    let internalUID = sourceAnnotationDetail.uid;
    if (!internalUID) {
      internalUID = guid();
      log.info(
        `Annotation does not have UID, Generating UID for the created Measurement: ${internalUID}`
      );
    }

    const oldMeasurement = this.measurements.get(internalUID);

    const newMeasurement = {
      ...oldMeasurement,
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      uid: internalUID,
    };

    if (oldMeasurement) {
      // TODO: Ultimately, each annotation should have a selected flag right from the source.
      // For now, it is just added in OHIF here and in setMeasurementSelected.
      this.measurements.set(internalUID, newMeasurement);
      if (isUpdate) {
        this._broadcastEvent(this.EVENTS.MEASUREMENT_UPDATED, {
          source,
          measurement: newMeasurement,
          notYetUpdatedAtSource: false,
        });
      } else {
        log.info('Measurement added.', newMeasurement);
        this._broadcastEvent(this.EVENTS.MEASUREMENT_ADDED, {
          source,
          measurement: newMeasurement,
        });
      }
    } else {
      log.info('Measurement started.', newMeasurement);
      this.measurements.set(internalUID, newMeasurement);
    }

    return newMeasurement.uid;
  }

  /**
   * Removes a measurement and broadcasts the removed event.
   *
   * @param {string} measurementUID The measurement uid
   * @param {MeasurementSource} source The measurement source instance
   */
  remove(measurementUID, source, eventDetails) {
    if (
      !measurementUID ||
      (!this.measurements.has(measurementUID) && !this.unmappedMeasurements.has(measurementUID))
    ) {
      log.warn(`No uid provided, or unable to find measurement by uid.`);
      return;
    }

    this.unmappedMeasurements.delete(measurementUID);
    this.measurements.delete(measurementUID);
    this._broadcastEvent(this.EVENTS.MEASUREMENT_REMOVED, {
      source,
      measurement: measurementUID,
      ...eventDetails,
    });
  }

  clearMeasurements() {
    // Make a copy of the measurements
    const measurements = [...this.measurements.values(), ...this.unmappedMeasurements.values()];
    this.unmappedMeasurements.clear();
    this.measurements.clear();
    this._broadcastEvent(this.EVENTS.MEASUREMENTS_CLEARED, { measurements });
  }

  /**
   * Called after the mode.onModeExit is called to reset the state.
   * To store measurements for later use, store them in the mode.onModeExit
   * and restore them in the mode onModeEnter.
   */
  onModeExit() {
    this.clearMeasurements();
  }

  /**
   * This method calls the subscriptions for JUMP_TO_MEASUREMENT_VIEWPORT
   * and JUMP_TO_MEASUREMENT_LAYOUT.  There are two events which are
   * fired because there are two different items which might want to handle
   * the event.  First, there might already be a viewport which can handle
   * the event.  If so, then the layout doesn't need to necessarily change.
   * This is communicated by the isConsumed value on the event itself.
   * Otherwise, the layout itself may need to be navigated to in order
   * to provide a viewport which can show the given measurement.
   *
   * When a viewport decides to apply the event, it should call the consume()
   * method on the event, so that other listeners know they do not need to
   * navigate.  This does NOT affect whether the layout event is fired, and
   * merely causes it to fire the event with the isConsumed set to true.
   */

  public jumpToMeasurement(viewportId: string, measurementUID: string): void {
    const measurement = this.measurements.get(measurementUID);

    if (!measurement) {
      log.warn(`No measurement uid, or unable to find by uid.`);
      return;
    }
    const consumableEvent = this.createConsumableEvent({
      viewportId,
      measurement,
    });

    this._broadcastEvent(EVENTS.JUMP_TO_MEASUREMENT_VIEWPORT, consumableEvent);
    this._broadcastEvent(EVENTS.JUMP_TO_MEASUREMENT_LAYOUT, consumableEvent);
  }

  _getSourceUID(name, version) {
    const { sources } = this;

    const sourceUID = Object.keys(sources).find(sourceUID => {
      const source = sources[sourceUID];

      return source.name === name && source.version === version;
    });

    return sourceUID;
  }

  _getMappingByMeasurementSource(measurement, annotationType) {
    if (this._isValidSource(measurement.source)) {
      return this.mappings[measurement.source.uid].find(m => m.annotationType === annotationType);
    }
  }

  /**
   * Get measurement mapping function if matching criteria.
   *
   * @param {MeasurementSource} source Measurement source instance
   * @param {string} annotationType The source annotationType
   * @param {Measurement} measurement The measurement service measurement
   * @return {Object} The mapping based on matched criteria
   */
  _getMatchingMapping(source, annotationType, measurement) {
    const sourceMappings = this.mappings[source.uid];

    const sourceMappingsByDefinition = sourceMappings.filter(
      mapping => mapping.annotationType === annotationType
    );

    /* Criteria Matching */
    return sourceMappingsByDefinition.find(({ matchingCriteria }) => {
      return measurement.points && measurement.points.length === matchingCriteria.points;
    });
  }

  /**
   * Returns formatted string with source info.
   *
   * @param {MeasurementSource} source Measurement source
   * @return {string} Source information
   */
  _getSourceToString(source) {
    return `${source.name}@${source.version}`;
  }

  /**
   * Checks if given source is valid.
   *
   * @param {MeasurementSource} source Measurement source
   * @return {boolean} Measurement source validation
   */
  _isValidSource(source) {
    return source && this.sources[source.uid];
  }

  /**
   * Checks if a given source has mappings.
   *
   * @param {MeasurementSource} source The measurement source
   * @return {boolean} Validation if source has mappings
   */
  _sourceHasMappings(source) {
    return Array.isArray(this.mappings[source.uid]) && this.mappings[source.uid].length;
  }

  /**
   * Check if a given measurement data is valid.
   *
   * @param {Measurement} measurementData Measurement data
   * @return {boolean} Measurement validation
   */
  _isValidMeasurement(measurementData) {
    return Object.keys(measurementData).every(key => {
      if (!MEASUREMENT_SCHEMA_KEYS.includes(key)) {
        log.warn(`Invalid measurement key: ${key}`);
        return false;
      }

      return true;
    });
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
