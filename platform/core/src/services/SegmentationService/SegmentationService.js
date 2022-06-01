import pubSubServiceInterface from '../_shared/pubSubServiceInterface';

const EVENTS = {
  SEGMENTATION_UPDATED: 'event::segmentation_updated',
  SEGMENTATION_ADDED: 'event::segmentation_added',
  SEGMENTATION_REMOVED: 'event::segmentation_removed',
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
   * Get all segmentations.
   *
   * @return Array of segmentations
   */
  getSegmentations() {
    const segmentations = this._arrayOfObjects(this.segmentations);
    return (
      segmentations &&
      segmentations.map(m => this.segmentations[Object.keys(m)[0]])
    );
  }

  /**
   * Get specific segmentation by its id.
   *
   * @param id If of the segmentation
   * @return segmentation instance
   */
  getSegmentation(id) {
    return this.segmentations[id];
  }

  addOrUpdateSegmentation(
    id,
    segmentationSchema,
    notYetUpdatedAtSource = false
  ) {
    const segmentation = this.segmentations[id];

    if (segmentation) {
      Object.assign(segmentation, segmentationSchema);

      this._broadcastEvent(this.EVENTS.SEGMENTATION_UPDATED, {
        id,
        segmentation,
        notYetUpdatedAtSource: notYetUpdatedAtSource,
      });

      return;
    }

    this.segmentations[id] = {
      ...segmentationSchema,
      visible: true,
    };

    this._broadcastEvent(this.EVENTS.SEGMENTATION_ADDED, {
      id,
      segmentation,
    });
  }

  /**
   * Toggles the visibility of a segmentation in the state, and broadcasts the event.
   * Note: this method does not update the segmentation state in the source. It only
   * updates the state, and there should be separate listeners for that.
   * @param ids segmentation ids
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
   * Removes a segmentation and broadcasts the removed event.
   *
   * @param {string} id The segmentation id
   */
  remove(id) {
    if (!id || !this.segmentations[id]) {
      console.warn(`No id provided, or unable to find segmentation by id.`);
      return;
    }
    delete this.segmentations[id];
    this._broadcastEvent(this.EVENTS.SEGMENTATION_REMOVED, {
      id,
    });
  }

  /**
   * Clear all segmentations and broadcasts cleared event.
   */
  clear() {
    Object.keys(this.segmentations).forEach(id => {
      this.remove(id);
    });

    this.segmentations = {};
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
