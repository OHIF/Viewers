import pubSubServiceInterface from '../_shared/pubSubServiceInterface';

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
    this.segmentations = {};
    this.listeners = {};
    Object.defineProperty(this, 'EVENTS', {
      value: EVENTS,
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
  getSegmentations() {}

  /**
   * Get specific measurement by its id.
   *
   * @param {string} id If of the measurement
   * @return {Measurement} Measurement instance
   */
  getSegmentation(id) {}

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param {string[]} ids segmentation ids
   */
  toggleSegmentationsVisibility(ids) {
    // ids.forEach(id => {
    //   const segmentation = this.segmentations[id];
    //   if (!segmentation) {
    //     throw new Error(`Segmentation with id ${id} not found.`);
    //   }
    //   segmentation.visible = !segmentation.visible;
    //   this._broadcastEvent(this.EVENTS.SEGMENTATION_VISIBILITY_CHANGED, {
    //     segmentation,
    //   });
    // });
  }

  /**
   * Removes a measurement and broadcasts the removed event.
   *
   * @param {string} id The measurement id
   * @param {segmentationsource} source The measurement source instance
   * @return {string} The removed measurement id
   */
  remove(id, source) {
    // if (!id || !this.segmentations[id]) {
    //   log.warn(`No id provided, or unable to find measurement by id.`);
    //   return;
    // }
    // delete this.segmentations[id];
    // this._broadcastEvent(this.EVENTS.SEGMENTATION_REMOVED, {
    //   source,
    //   segmentationId: id, // This is weird :shrug:
    // });
  }

  clearSegmentations() {
    this.segmentations = {};
    this._jumpToMeasurementCache = {};
    this._broadcastEvent(this.EVENTS.SEGMENTATIONS_CLEARED);
  }

  /**
   * Clear all measurements and broadcasts cleared event.
   */
  clear() {
    this.segmentations = {};
    this._broadcastEvent(this.EVENTS.SEGMENTATIONS_CLEARED);
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

export default SegmentationService;
export { EVENTS, VALUE_TYPES };
