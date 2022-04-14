import log from '../../log';
import guid from '../../utils/guid';
import pubSubServiceInterface from '../_shared/pubSubServiceInterface';

/* Measurement schema keys for object validation. */
const SEGMENTATION_KEYS = [
  'id',
  'name',
  'label',
  'labelmapIndex',
  'activeLabelmapIndex',
  'dimensions',
  'sizeInBytes',
  'FrameOfReferenceUID',
  'type',
  'displayText',
  'metadata',
  'source',
  'cachedStats',
];

const EVENTS = {
  SEGMENTATION_UPDATED: 'event::segmentation_updated',
  SEGMENTATION_ADDED: 'event::segmentation_added',
  SEGMENTATION_REMOVED: 'event::segmentation_removed',
  SEGMENTATIONS_CLEARED: 'event::segmentation_cleared',
  SEGMENTATION_VISIBILITY_CHANGED: 'event::SEGMENTATION_VISIBILITY_CHANGED',
};

const VALUE_TYPES = {};

class SegmentationService {
  constructor() {
    this.sources = {};
    this.mappings = {};
    this.segmentations = {};
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
  getSegmentations() {
    const measurements = this._arrayOfObjects(this.segmentations);
    return (
      measurements &&
      measurements.map(m => this.segmentations[Object.keys(m)[0]])
    );
  }

  /**
   * Get specific measurement by its id.
   *
   * @param {string} id If of the measurement
   * @return {Measurement} Measurement instance
   */
  getSegmentation(id) {
    let segmentation = null;
    const segmentations = this.segmentations[id];

    if (segmentations && Object.keys(segmentations).length > 0) {
      segmentation = this.segmentations[id];
    }

    return segmentation;
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
    // source.getAnnotation = (definition, measurementId) => {
    //   return this.getAnnotation(source, definition, measurementId);
    // };

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

  addMapping(
    source,
    definition,
    matchingCriteria,
    toSourceSchema,
    toSegmentationSchema
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

    if (!toSegmentationSchema) {
      throw new Error('Segmentation mapping function not provided.');
    }

    const mapping = {
      matchingCriteria,
      definition,
      toSourceSchema,
      toSegmentationSchema,
    };

    if (Array.isArray(this.mappings[source.id])) {
      this.mappings[source.id].push(mapping);
    } else {
      this.mappings[source.id] = [mapping];
    }

    log.info(
      `New Segmentation mapping added to source '${this._getSourceInfo(
        source
      )}'.`
    );
  }

  addOrUpdate(source, definition, sourceSegmentation) {
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

    let segmentation = {};
    try {
      const sourceMappings = this.mappings[source.id];
      const { toSegmentationSchema } = sourceMappings.find(
        mapping => mapping.definition === definition
      );

      /* Convert measurement */
      segmentation = toSegmentationSchema(sourceSegmentation);

      /* Assign measurement source instance */
      segmentation.source = source;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Failed to map '${sourceInfo}' segmentation for definition ${definition}:`,
        error.message
      );
    }

    if (!this._isValidSegmentation(segmentation)) {
      throw new Error(
        `Attempting to add or update a invalid segmentation provided by '${sourceInfo}'. Exiting early.`
      );
    }

    let internalId = sourceSegmentation.id;
    if (!internalId) {
      internalId = guid();
      log.info(`Segmentation ID not found. Generating UID: ${internalId}`);
    }

    const newSegmentation = {
      ...segmentation,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      id: internalId,
    };

    if (this.segmentations[internalId]) {
      // log.info(
      //   `Measurement already defined. Updating measurement.`,
      //   newSegmentation
      // );
      this.segmentations[internalId] = newSegmentation;
      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        source,
        segmentation: newSegmentation,
        notYetUpdatedAtSource: false,
      });
    } else {
      log.info('Segmentation added.', newSegmentation);
      this.segmentations[internalId] = newSegmentation;
      this._broadcastEvent(this.EVENTS.SEGMENTATION_ADDED, {
        source,
        segmentation: newSegmentation,
      });
    }

    return newSegmentation.id;
  }

  update(id, segmentation, notYetUpdatedAtSource = false) {
    if (this.segmentations[id]) {
      const updatedSegmentation = {
        ...segmentation,
        modifiedTimestamp: Math.floor(Date.now() / 1000),
      };

      log.info(
        `Updating internal measurement representation...`,
        updatedSegmentation
      );

      this.segmentations[id] = updatedSegmentation;

      this._broadcastEvent(
        // Add an internal flag to say the measurement has not yet been updated at source.
        this.EVENTS.SEGMENTATION_UPDATED,
        {
          source: segmentation.source,
          segmentation: updatedSegmentation,
          notYetUpdatedAtSource,
        }
      );

      return updatedSegmentation.id;
    }
  }

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param {string[]} ids segmentation ids
   */
  toggleSegmentationsVisibility(ids) {
    ids.forEach(id => {
      const segmentation = this.segmentations[id];

      if (!segmentation) {
        throw new Error(`Segmentation with id ${id} not found.`);
      }

      segmentation.visible = !segmentation.visible;
      this._broadcastEvent(this.EVENTS.SEGMENTATION_VISIBILITY_CHANGED, {
        segmentation,
      });
    });
  }

  /**
   * Removes a measurement and broadcasts the removed event.
   *
   * @param {string} id The measurement id
   * @param {segmentationsource} source The measurement source instance
   * @return {string} The removed measurement id
   */
  remove(id, source) {
    if (!id || !this.segmentations[id]) {
      log.warn(`No id provided, or unable to find measurement by id.`);
      return;
    }

    delete this.segmentations[id];
    this._broadcastEvent(this.EVENTS.SEGMENTATION_REMOVED, {
      source,
      segmentationId: id, // This is weird :shrug:
    });
  }

  clearSegmentations() {
    this.segmentations = {};
    this._jumpToMeasurementCache = {};
    this._broadcastEvent(this.EVENTS.SEGMENTATIONS_CLEARED);
  }

  // jumpToMeasurement(viewportIndex, id) {
  //   const measurement = this.segmentations[id];

  //   if (!measurement) {
  //     log.warn(`No id provided, or unable to find measurement by id.`);
  //     return;
  //   }

  //   this._addJumpToMeasurement(viewportIndex, id);

  //   const eventName = this.EVENTS.JUMP_TO_MEASUREMENT;

  //   const hasListeners = Object.keys(this.listeners).length > 0;
  //   const hasCallbacks = Array.isArray(this.listeners[eventName]);

  //   if (hasListeners && hasCallbacks) {
  //     this.listeners[eventName].forEach(listener => {
  //       listener.callback({ viewportIndex, measurement });
  //     });
  //   }
  // }

  // _addJumpToMeasurement(viewportIndex, id) {
  //   this._jumpToMeasurementCache[viewportIndex] = id;
  // }

  // getJumpToMeasurement(viewportIndex) {
  //   return this._jumpToMeasurementCache[viewportIndex];
  // }

  // removeJumpToMeasurement(viewportIndex) {
  //   delete this._jumpToMeasurementCache[viewportIndex];
  // }

  _getMappingBySegmentationSource(segId, definition) {
    const segmentation = this.getSegmentation(segId);
    if (this._isValidSource(segmentation.source)) {
      return this.mappings[segmentation.source.id].find(
        m => m.definition === definition
      );
    }
  }

  /**
   * Clear all measurements and broadcasts cleared event.
   */
  clear() {
    this.segmentations = {};
    this._broadcastEvent(this.EVENTS.SEGMETATION_CLEARED);
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
      return (
        measurement.points &&
        measurement.points.length === matchingCriteria.points
      );
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
  _isValidSegmentation(segmentationData) {
    Object.keys(segmentationData).forEach(key => {
      if (!SEGMENTATION_KEYS.includes(key)) {
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

export default SegmentationService;
export { EVENTS, VALUE_TYPES };
