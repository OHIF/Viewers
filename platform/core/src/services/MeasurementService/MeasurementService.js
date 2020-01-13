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
   * @param {Object} measurement
   * @param {string} measurement.id
   * @param {MeasurementSchema} measurement.data
   */
  addOrUpdate({ id, data }) {
    if (!this._isValidMeasurement(data)) {
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

    const measurement = {
      id,
      modifiedTimestamp: Math.floor(Date.now() / 1000),
      ...data,
    };

    if (this.measurements[internalId]) {
      log.warn(`Measurement already defined. Updating measurement.`);
      this.measurements[internalId] = measurement;
      this._broadcastChange(internalId, EVENTS.MEASUREMENT_UPDATED);
    } else {
      log.warn(`Measurement added.`);
      this.measurements[internalId] = measurement;
      this._broadcastChange(internalId, EVENTS.MEASUREMENT_ADDED);
    }

    return measurement.id;
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
