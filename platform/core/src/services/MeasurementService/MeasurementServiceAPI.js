import log from '../../log';

export default class MeasurementServiceAPI {
  constructor({ service }) {
    this.measurements = {};
    this.listeners = {};

    if (service) {
      service.setServiceImplementation({
        addOrUpdate: this.addOrUpdate.bind(this),
        subscribe: this.subscribe.bind(this),
      });
    }
  }

  /**
   * Adds or update persisted measurements.
   *
   * @param {MeasurementSchema} schema { id, annotation }
   */
  addOrUpdate({ id, annotation, broadcastEventName }) {
    const isMeasurementValid = this._checkMeasurementValidity(annotation);

    if (!isMeasurementValid) {
      log.warn(
        'Attempting to add or update a null/undefined measurement. Exiting early.'
      );
      return;
    }

    let measurementId = id;
    if (!measurementId) {
      measurementId = Math.random()
        .toString(36)
        .substr(2, 5);

      log.warn(
        `Measurement ID not set. Using random string ID: ${measurementId}`
      );
    }

    const modifiedTimestamp = Math.floor(Date.now() / 1000);
    this.measurements[measurementId] = { modifiedTimestamp, annotation };

    /* Simple broadcast change */
    if (Object.keys(this.listeners).length > 0) {
      /* Should subscription event names be handled outside like here? Where to keep available subscription event names? */
      this.listeners[broadcastEventName].forEach(callback => {
        callback(this.measurements[measurementId]);
      });
    }
  }

  /**
   * Subscribe to measurement changes.
   *
   * @param {String} eventName
   * @param {Function} callback
   */
  subscribe(eventName, callback) {
    if (Array.isArray(this.listeners[eventName])) {
      this.listeners[eventName].push(callback);
    } else {
      this.listeners[eventName] = [callback];
    }
  }

  /**
   * Check if a given measurement is valid.
   *
   * @param {MeasurementSchema} schema { id, data }
   */
  _checkMeasurementValidity(measurement) {
    return true;
  }
}
