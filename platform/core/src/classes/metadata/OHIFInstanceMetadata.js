import { InstanceMetadata } from './InstanceMetadata';
import getImageId from '../../utils/getImageId.js';

export class OHIFInstanceMetadata extends InstanceMetadata {
  /**
   * @param {Object} Instance object.
   */
  constructor(data, series, study, uid) {
    super(data, uid);
    this.init(series, study);
  }

  init(series, study) {
    const instance = this.getData();

    // Initialize Private Properties
    Object.defineProperties(this, {
      _sopInstanceUID: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: instance.SOPInstanceUID,
      },
      _study: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: study,
      },
      _series: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: series,
      },
      _instance: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: instance,
      },
      _cache: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: Object.create(null),
      },
    });
  }

  // Override
  getTagValue(tagOrProperty, defaultValue, bypassCache) {
    // check if this property has been cached...
    if (tagOrProperty in this._cache && bypassCache !== true) {
      return this._cache[tagOrProperty];
    }

    const instanceData = this._instance.metadata;

    // Search property value in the whole study metadata chain...
    let rawValue;
    if (tagOrProperty in instanceData) {
      rawValue = instanceData[tagOrProperty];
    } else if (tagOrProperty in this._series) {
      rawValue = this._series[tagOrProperty];
    } else if (tagOrProperty in this._study) {
      rawValue = this._study[tagOrProperty];
    }

    if (rawValue !== void 0) {
      // if rawValue value is not undefined, cache result...
      this._cache[tagOrProperty] = rawValue;
      return rawValue;
    }

    return defaultValue;
  }

  // Override
  tagExists(tagOrProperty) {
    return (
      tagOrProperty in this._instance.metadata ||
      tagOrProperty in this._series ||
      tagOrProperty in this._study
    );
  }

  // Override
  getImageId(frame, thumbnail) {
    // If _imageID is not cached, create it
    if (this._imageId === null) {
      this._imageId = getImageId(this.getData(), frame, thumbnail);
    }

    return this._imageId;
  }
}
