import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import debounce from 'lodash.debounce';

import StackManager from '../utils/StackManager';
import { StudyPrefetcher } from './StudyPrefetcher';

class BaseLoadingListener {
  constructor(stack, options = {}) {
    this.id = BaseLoadingListener.getNewId();
    this.stack = stack;
    this.statsItemsLimit = options.statsItemsLimit || 2;
    this.stats = {
      items: [],
      total: 0,
      elapsedTime: 0,
      speed: 0,
    };

    this._setProgressData = options._setProgressData;
    this._clearProgressById = options._clearProgressById;

    // Register the start point to make it possible to calculate
    // bytes/s or frames/s when the first byte or frame is received
    this._addStatsData(0);

    // Update the progress before starting the download
    // to make it possible to update the UI
    this._updateProgress();
  }

  _addStatsData(value) {
    const date = new Date();
    const stats = this.stats;
    const items = stats.items;
    const newItem = {
      value,
      date,
    };

    items.push(newItem);
    stats.total += newItem.value;

    // Remove items until it gets below the limit
    while (items.length > this.statsItemsLimit) {
      const item = items.shift();
      stats.total -= item.value;
    }

    // Update the elapsedTime (seconds) based on first and last
    // elements and recalculate the speed (bytes/s or frames/s)
    if (items.length > 1) {
      const oldestItem = items[0];
      stats.elapsedTime =
        (newItem.date.getTime() - oldestItem.date.getTime()) / 1000;
      stats.speed = (stats.total - oldestItem.value) / stats.elapsedTime;
    }
  }

  _getProgressId() {
    /**
     * TODO: The id key should be configurable.
     */
    const displaySetInstanceUID = this.stack.displaySetInstanceUID;
    return 'StackProgress:' + displaySetInstanceUID;
  }

  _clearProgress() {
    const progressId = this._getProgressId();
    this._clearProgressById(progressId);
  }

  startListening() {
    throw new Error('`startListening` must be implemented by child classes');
  }

  stopListening() {
    throw new Error('`stopListening` must be implemented by child classes');
  }

  destroy() {
    this.stopListening();
    this._clearProgress();
  }

  static getNewId() {
    const timeSlice = new Date()
      .getTime()
      .toString()
      .slice(-8);
    const randomNumber = parseInt(Math.random() * 1000000000);

    return timeSlice.toString() + randomNumber.toString();
  }
}

class DICOMFileLoadingListener extends BaseLoadingListener {
  constructor(stack, options) {
    super(stack, options);

    this.imageLoadProgressEventHandler = this._imageLoadProgressEventHandler.bind(
      this
    );

    this._dataSetUrl = this._getDataSetUrl(stack);
    this._lastLoaded = 0;

    // Check how many instances has already been download (cached)
    this._checkCachedData();

    this.startListening();
  }

  _checkCachedData() {
    const dataSet = cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.get(
      this._dataSetUrl
    );

    if (dataSet) {
      const dataSetLength = dataSet.byteArray.length;

      this._updateProgress({
        percentComplete: 100,
        loaded: dataSetLength,
        total: dataSetLength,
      });
    }
  }

  _getImageLoadProgressEventName() {
    // TODO: Add this event as a constant in Cornerstone
    return 'cornerstoneimageloadprogress.' + this.id;
  }

  startListening() {
    const imageLoadProgressEventName = this._getImageLoadProgressEventName();

    this.stopListening();

    cornerstone.events.addEventListener(
      imageLoadProgressEventName,
      this.imageLoadProgressEventHandle
    );
  }

  stopListening() {
    const imageLoadProgressEventName = this._getImageLoadProgressEventName();
    cornerstone.events.removeEventListener(
      imageLoadProgressEventName,
      this.imageLoadProgressEventHandle
    );
  }

  _imageLoadProgressEventHandler = e => {
    const eventData = e.detail;
    const dataSetUrl = this._convertImageIdToDataSetUrl(eventData.imageId);
    const bytesDiff = eventData.loaded - this._lastLoaded;

    if (!this._dataSetUrl === dataSetUrl) {
      return;
    }

    // Add the bytes downloaded to the stats
    this._addStatsData(bytesDiff);

    // Update the download progress
    this._updateProgress(eventData);

    // Cache the last eventData.loaded value
    this._lastLoaded = eventData.loaded;
  };

  _updateProgress(eventData) {
    const progressId = this._getProgressId();
    eventData = eventData || {};

    const progressData = {
      multiFrame: false,
      percentComplete: eventData.percentComplete,
      bytesLoaded: eventData.loaded,
      bytesTotal: eventData.total,
      bytesPerSecond: this.stats.speed,
    };

    this._setProgressData(progressId, progressData);
  }

  _convertImageIdToDataSetUrl(imageId) {
    // Remove the prefix ("dicomweb:" or "wadouri:"")
    imageId = imageId.replace(/^(dicomweb:|wadouri:)/i, '');

    // Remove "frame=999&" from the imageId
    imageId = imageId.replace(/frame=\d+&?/i, '');

    // Remove the last "&" like in "http://...?foo=1&bar=2&"
    imageId = imageId.replace(/&$/, '');

    return imageId;
  }

  _getDataSetUrl(stack) {
    const imageId = stack.imageIds[0];
    return this._convertImageIdToDataSetUrl(imageId);
  }
}

const StudyLoadingListenerEvents = {
  OnProgress: 'StudyLoadingListenerEvents.OnProgress',
};

function promiseState(promise, callback) {
  // Symbols and RegExps are never content-equal
  var uniqueValue = window['Symbol'] ? Symbol('unique') : /unique/;

  function notifyPendingOrResolved(value) {
    if (value === uniqueValue) {
      return callback('pending');
    } else {
      return callback('fulfilled');
    }
  }

  function notifyRejected(reason) {
    return callback('rejected');
  }

  var race = [promise, Promise.resolve(uniqueValue)];
  Promise.race(race).then(notifyPendingOrResolved, notifyRejected);
}

class StackLoadingListener extends BaseLoadingListener {
  constructor(stack, options = {}) {
    options.statsItemsLimit = 20;

    super(stack, options);

    this.imageLoadedEventHandler = this._imageLoadedEventHandler.bind(this);
    this.imageCachePromiseRemovedEventHandler = this._imageCachePromiseRemovedEventHandler.bind(
      this
    );

    this.imageDataMap = this._convertImageIdsArrayToMap(stack.imageIds);
    this.framesStatus = this._createArray(stack.imageIds.length, false);
    this.loadedCount = 0;

    // Check how many instances has already been download (cached)
    this._debouncedSetProgressData = debounce((...args) => {
      this._setProgressData(...args);

      /** After checking cache, continue prefetch */
      const studyPrefetcher = StudyPrefetcher.getInstance();
      studyPrefetcher.prefetch(studyPrefetcher.getElement());
    }, 300);
    const debounced = true;
    this._checkCachedData(debounced);

    this.startListening();
  }

  _convertImageIdsArrayToMap(imageIds) {
    const imageIdsMap = new Map();

    for (let i = 0; i < imageIds.length; i++) {
      imageIdsMap.set(imageIds[i], {
        index: i,
        loaded: false,
      });
    }

    return imageIdsMap;
  }

  _createArray(length, defaultValue) {
    // `new Array(length)` is an anti-pattern in javascript because its
    // funny API. Otherwise I would go for `new Array(length).fill(false)`
    const array = [];

    for (let i = 0; i < length; i++) {
      array[i] = defaultValue;
    }

    return array;
  }

  /**
   * Check if image id is cached in cornerstone.
   *
   * @param {string} imageId
   * @returns
   */
  isImageCached(imageId) {
    const image = cornerstone.imageCache.imageCache[imageId];
    return image && image.sizeInBytes;
  }

  _checkCachedData(debounced = false) {
    const imageIds = this.stack.imageIds;

    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];

      const imageObject = cornerstone.imageCache.getImageLoadObject(imageId);

      if (this.isImageCached(imageId)) {
        this._updateFrameStatus(imageId, true, debounced);
      }

      if (imageObject && imageObject.promise) {
        promiseState(imageObject.promise, state => {
          if (state === 'fulfilled') {
            this._updateFrameStatus(imageId, true, debounced);
          }
        });
      }
    }
  }

  _getImageLoadedEventName() {
    return `${cornerstone.EVENTS.IMAGE_LOADED}.${this.id}`;
  }

  _getImageCachePromiseRemoveEventName() {
    return `${cornerstone.EVENTS.IMAGE_CACHE_PROMISE_REMOVED}.${this.id}`;
  }

  _imageLoadedEventHandler(e) {
    this._updateFrameStatus(e.detail.image.imageId, true);
  }

  _imageCachePromiseRemovedEventHandler(e) {
    this._updateFrameStatus(e.detail.imageId, false);
  }

  startListening() {
    const imageLoadedEventName = this._getImageLoadedEventName();
    const imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

    this.stopListening();

    cornerstone.events.addEventListener(
      imageLoadedEventName,
      this.imageLoadedEventHandler
    );
    cornerstone.events.addEventListener(
      imageCachePromiseRemovedEventName,
      this.imageCachePromiseRemovedEventHandler
    );
  }

  stopListening() {
    const imageLoadedEventName = this._getImageLoadedEventName();
    const imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

    cornerstone.events.removeEventListener(
      imageLoadedEventName,
      this.imageLoadedEventHandler
    );
    cornerstone.events.removeEventListener(
      imageCachePromiseRemovedEventName,
      this.imageCachePromiseRemovedEventHandler
    );
  }

  _updateFrameStatus(imageId, loaded, debounced) {
    const imageData = this.imageDataMap.get(imageId);

    if (!imageData || imageData.loaded === loaded) {
      return;
    }

    // Add one more frame to the stats
    if (loaded) {
      this._addStatsData(1);
    }

    imageData.loaded = loaded;
    this.framesStatus[imageData.index] = loaded;
    this.loadedCount += loaded ? 1 : -1;
    this._updateProgress(debounced);
  }

  _setProgressData(progressId, progressData) {
    // TODO: This method (and _clearProgressById) need to access
    // the Redux store and should therefore be provided from the
    // application. I've added a workaround to pass this in through
    // the 'options' variable on instantiation, but this is really ugly.
    // We could consider making the StudyLoadingListener a higher-order
    // component which would set this stuff itself.
    throw new Error(
      "The _setProgressData function must be provided in StudyLoadingListener's options"
    );
  }

  _clearProgressById(progressId) {
    throw new Error(
      "The _clearProgressById function must be provided in StudyLoadingListener's options"
    );
  }

  _updateProgress(debounced) {
    const totalFramesCount = this.stack.imageIds.length;
    const loadedFramesCount = this.loadedCount;
    const loadingFramesCount = totalFramesCount - loadedFramesCount;
    const percentComplete = Math.ceil(
      (loadedFramesCount / totalFramesCount) * 100
    );
    const progressId = this._getProgressId();
    const progressData = {
      multiFrame: true,
      totalFramesCount,
      loadedFramesCount,
      loadingFramesCount,
      percentComplete,
      framesPerSecond: this.stats.speed,
      framesStatus: this.framesStatus,
    };

    if (debounced) {
      this._debouncedSetProgressData(progressId, progressData);
      return;
    }

    this._setProgressData(progressId, progressData);
  }

  _logProgress() {
    const totalFramesCount = this.stack.imageIds.length;
    const displaySetInstanceUID = this.stack.displaySetInstanceUID;
    let progressBar = '[';

    for (let i = 0; i < totalFramesCount; i++) {
      const ch = this.framesStatus[i] ? '|' : '.';
      progressBar += `${ch}`;
    }

    progressBar += ']';
    console.info(`${displaySetInstanceUID}: ${progressBar}`);
  }
}

class StudyLoadingListener {
  static events = StudyLoadingListenerEvents;

  constructor(options) {
    this.listeners = {};
    this.options = options;
  }

  addStack(stack, stackMetaData) {
    // TODO: Make this work for plugins
    if (!stack) {
      //console.log('Skipping adding stack to StudyLoadingListener');
      return;
    }

    const displaySetInstanceUID = stack.displaySetInstanceUID;

    if (!this.listeners[displaySetInstanceUID]) {
      const listener = this._createListener(stack, stackMetaData);
      if (listener) {
        this.listeners[displaySetInstanceUID] = listener;
      }
    }
  }

  addStudy(study) {
    study.displaySets.forEach(displaySet => {
      const stack = StackManager.findOrCreateStack(study, displaySet);

      // TODO: Make this work for plugins
      if (!stack) {
        console.warn('Skipping adding displaySet to StudyLoadingListener');
        console.warn(displaySet);
        return;
      }

      this.addStack(stack, {
        isMultiFrame: displaySet.isMultiFrame,
      });
    });
  }

  addStudies(studies) {
    if (!studies || !studies.length) {
      return;
    }

    studies.forEach(study => this.addStudy(study));
  }

  clear() {
    const displaySetInstanceUIDs = Object.keys(this.listeners);
    const length = displaySetInstanceUIDs.length;

    for (let i = 0; i < length; i++) {
      const displaySetInstanceUID = displaySetInstanceUIDs[i];
      const displaySet = this.listeners[displaySetInstanceUID];

      displaySet.destroy();
    }

    this.listeners = {};
  }

  _createListener(stack, stackMetaData) {
    const schema = this._getSchema(stack);

    // A StackLoadingListener can be created if it's wadors or not a multiframe
    // wadouri instance (single file) that means "N" files will have to be
    // downloaded where "N" is the number of frames. DICOMFileLoadingListener
    // is created only if it's a single DICOM file and there's no way to know
    // how many frames has already been loaded (bytes/s instead of frames/s).
    if (schema === 'wadors' || !stackMetaData.isMultiFrame) {
      return new StackLoadingListener(stack, this.options);
    } else {
      return new DICOMFileLoadingListener(stack, this.options);
    }
  }

  _getSchema(stack) {
    const imageId = stack.imageIds[0];
    if (!imageId) {
      return;
    }
    const colonIndex = imageId.indexOf(':');
    return imageId.substring(0, colonIndex);
  }

  static getInstance(options) {
    /**
     * TODO: Use a different alternative without the use of events.
     */
    const DEFAULT_OPTIONS = {
      _setProgressData: (progressId, progressData) => {
        const event = new CustomEvent(StudyLoadingListenerEvents.OnProgress, {
          detail: { progressId, progressData },
        });
        document.dispatchEvent(event);
      },
      _clearProgressById: progressId => {
        const event = new CustomEvent(StudyLoadingListenerEvents.OnProgress, {
          detail: { progressId, percentComplete: 0 },
        });
        document.dispatchEvent(event);
      },
    };

    if (!StudyLoadingListener._instance) {
      StudyLoadingListener._instance = new StudyLoadingListener(
        options || DEFAULT_OPTIONS
      );
    }

    return StudyLoadingListener._instance;
  }
}

export { StudyLoadingListener, StackLoadingListener, DICOMFileLoadingListener };
