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

  registerEvent(event) {
    this.events[event] = `event@${event}`;
  }

  /**
   * Adds or update persisted measurements.
   *
   * @param {MeasurementSchema} measurement
   */
  addOrUpdate(measurement) {
    const { id } = measurement;

    if (!this._isValidMeasurement(measurement)) {
      log.warn(
        'Attempting to add or update a null/undefined measurement. Exiting early.'
      );
      return;
    }

    let internalId = id;
    if (!internalId) {
      internalId = guid();
      log.warn(`Measurement ID not set. Using generated UID: ${internalId}`);
    }

    const newMeasurement = {
      ...measurement,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      id: internalId,
    };

    if (this.measurements[internalId]) {
      log.warn(`Measurement already defined. Updating measurement.`);
      this.measurements[internalId] = newMeasurement;
      this._broadcastChange(internalId, EVENTS.MEASUREMENT_UPDATED);
    } else {
      log.warn(`Measurement added.`);
      this.measurements[internalId] = newMeasurement;
      this._broadcastChange(internalId, EVENTS.MEASUREMENT_ADDED);
    }

    return newMeasurement.id;
  }

  _broadcastChange(measurementInternalId, event) {
    const hasListeners = Object.keys(this.listeners).length > 0;
    const hasCallbacks = Array.isArray(this.listeners[event]);

    if (hasListeners && hasCallbacks) {
      this.listeners[event].forEach(listener => {
        listener.callback(this.measurements[measurementInternalId]);
      });
    }
  }

  /**
   * Subscribe to measurement updates.
   *
   * @param {string} event
   * @param {Function} callback
   * @param {string} context
   */
  subscribe(event, callback, context = CONTEXTS.ALL) {
    if (this._isValidEvent(event)) {
      const listenerId = guid();

      if (Array.isArray(this.listeners[event])) {
        this.listeners[event].push({ id: listenerId, callback });
      } else {
        this.listeners[event] = [{ id: listenerId, callback }];
      }

      return { unsubscribe: () => this._unsubscribe(event, listenerId) };
    } else {
      throw new Error(`Event ${event} not supported.`);
    }
  }

  /**
   * Unsubscribe to measurement updates.
   */
  _unsubscribe(event, listenerId) {
    if (Array.isArray(this.listeners[event])) {
      this.listeners[event] = this.listeners[event].filter(
        ({ id }) => id !== listenerId
      );
    } else {
      this.listeners[event] = undefined;
    }
  }

  /**
   * Check if a given measurement data is valid.
   *
   * @param {MeasurementSchema} measurementData
   */
  _isValidMeasurement(measurementData) {
    return measurementData === measurementData;
  }

  /**
   * Check if a given measurement service event is valid.
   *
   * @param {string} event
   */
  _isValidEvent(event) {
    return Object.values(this.events).includes(event);
  }
}

export default MeasurementService;
export { EVENTS, CONTEXTS };
