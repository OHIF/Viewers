import log from '../../log';
import guid from '../../utils/guid';

const EVENTS = {
  MEASUREMENT_UPDATED: 'event::measurement_updated',
  MEASUREMENT_ADDED: 'event::measurement_added',
};

const CONTEXTS = {
  ALL: 'context::all',
  VIEWER: 'context::viewer',
  CORNERSTONE: 'context::cornerstone',
};

/**
 * A UI Element Position
 *
 * @typedef {Object} MeasurementSchema
 * @property {number} id -
 * @property {string} sopInstanceUID -
 * @property {string} frameOfReferenceUID -
 * @property {string} referenceSeriesUID -
 * @property {string} label -
 * @property {string} description -
 * @property {string} unit -
 * @property {Array} points -
 */

class MeasurementService {
  constructor() {
    this.measurements = {};
    this.listeners = {};
    this.events = EVENTS;
  }

  getEvents() {
    return { ...this.events };
  }

  registerEvent(eventName) {
    this.events[eventName] = `event::${eventName}`;
  }

  /**
   * Adds or update persisted measurements.
   *
   * @param {MeasurementSchema} measurement
   * @param {string} context
   */
  addOrUpdate(measurement, context = 'all') {
    const { id } = measurement;

    if (!this._isValidMeasurement(measurement)) {
      log.warn(
        `Attempting to add or update a invalid measurement in '${context}' context. Exiting early.`
      );
      return;
    }

    let internalId = id;
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
      log.warn(`Measurement already defined in '${context}' context. Updating measurement.`);
      this.measurements[context][internalId] = newMeasurement;
      this._broadcastChange(internalId, EVENTS.MEASUREMENT_UPDATED, context);
    } else {
      log.warn(`Measurement added in '${context}' context.`);
      this.measurements[context][internalId] = newMeasurement;
      this._broadcastChange(internalId, EVENTS.MEASUREMENT_ADDED, context);
    }

    return newMeasurement.id;
  }

  /**
   * Broadcasts measurement changes to a given context.
   *
   * @param {string} measurementId
   * @param {string} eventName
   * @param {string} context
   */
  _broadcastChange(measurementId, eventName, context) {
    if (!this.listeners[context]) {
      return;
    }

    const hasListeners = Object.keys(this.listeners[context]).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[context][eventName]);

    if (hasListeners && hasCallbacks) {
      this.listeners[context][eventName].forEach(listener => {
        listener.callback(this.measurements[context][measurementId]);
      });
    }
  }

  /**
   * Subscribe to measurement updates.
   *
   * @param {string} eventName
   * @param {Function} callback
   * @param {string} context
   */
  subscribe(eventName, callback, context = 'all') {
    if (this._isValidEvent(eventName)) {
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
   */
  _unsubscribe(eventName, listenerId, context) {
    if (!this.listeners[context]) {
      return;
    }

    if (Array.isArray(this.listeners[context][eventName])) {
      this.listeners[context][eventName] = this.listeners[context][eventName].filter(
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
   */
  _isValidMeasurement(measurementData) {
    const MEASUREMENT_SCHEMA_KEYS = [
      'id',
      'sopInstanceUID',
      'frameOfReferenceUID',
      'referenceSeriesUID',
      'label',
      'description',
      'unit',
      'points',
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
   */
  _isValidEvent(eventName) {
    return Object.values(this.events).includes(eventName);
  }
}

export default MeasurementService;
export { EVENTS, CONTEXTS };
