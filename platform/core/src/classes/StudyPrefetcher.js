import log from '../log.js';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import getImageId from '../utils/getImageId.js';
import studyMetadataManager from '../utils/studyMetadataManager';

const noop = () => {};

export class StudyPrefetcher {
  options = {
    order: 'closest',
    displaySetCount: 1,
    onImageCached: noop,
    requestType: 'prefetch',
    preventCache: false,
    prefetchDisplaySetsTimeout: 300,
    includeActiveDisplaySet: false,
  };

  constructor(studies, options) {
    this.studies = studies || [];

    if (options) {
      this.options = options;
    }

    cornerstone.events.addEventListener(
      'cornerstoneimagecachefull.StudyPrefetcher',
      this.cacheFullHandler
    );
  }

  /**
   * Remove previously set event listeners and stop prefetching.
   */
  destroy() {
    this.stopPrefetching();
    cornerstone.events.removeEventListener(
      'cornerstoneimagecachefull.StudyPrefetcher',
      this.cacheFullHandler
    );
  }

  /**
   * Get StudyPrefetcher singleton instance.
   *
   * @param {array} studies
   * @param {object} options
   * @returns
   */
  static getInstance(studies = [], options) {
    if (!StudyPrefetcher.instance) {
      StudyPrefetcher.instance = new StudyPrefetcher(studies, options);
    }

    if (options) {
      this.options = options;
    }

    return StudyPrefetcher.instance;
  }

  /**
   * OHIF study metadata instances.
   *
   * @param {array} studies
   */
  setStudies(studies) {
    this.stopPrefetching();
    this.studies = studies;
  }

  /**
   * Prefetch related display sets based on cornerstone viewport element
   * with previously set options.
   *
   * @param {*} element
   * @returns
   */
  prefetch(element) {
    if (!this.studies || !this.studies.length) {
      return;
    }

    this.stopPrefetching();
    this.prefetchDisplaySets(element);
  }

  /**
   * Stop prefetching images.
   */
  stopPrefetching() {
    cornerstoneTools.requestPoolManager.clearRequestStack('prefetch');
  }

  /**
   * Prefetch display sets async.
   *
   * @param {HTMLElement} element cornerstone viewport element
   * @param {number} timeout
   */
  prefetchDisplaySetsAsync(element, timeout) {
    timeout = timeout || this.options.prefetchDisplaySetsTimeout;
    clearTimeout(this.prefetchDisplaySetsHandler);
    this.prefetchDisplaySetsHandler = setTimeout(() => {
      this.prefetchDisplaySets(element);
    }, timeout);
  }

  /**
   * Extract all image ids from all display sets to be fetched and
   * call method to add images to request pool manager.
   *
   * @param {HTMLElement} element cornerstone viewport element
   */
  prefetchDisplaySets(element) {
    const displaySetsToPrefetch = this.getDisplaySetsToPrefetch(element);
    const imageIds = this.getImageIdsFromDisplaySets(displaySetsToPrefetch);
    this.prefetchImageIds(imageIds);
  }

  /**
   * Add image ids to request pool manager.
   *
   * @param {array} imageIds
   */
  prefetchImageIds(imageIds) {
    const nonCachedImageIds = this.filterCachedImageIds(imageIds);
    const requestPoolManager = cornerstoneTools.requestPoolManager;

    nonCachedImageIds.forEach(imageId => {
      requestPoolManager.addRequest(
        {},
        imageId,
        this.options.requestType,
        this.options.preventCache,
        () => this.options.onImageCached(imageId, imageIds),
        noop
      );
    });

    requestPoolManager.startGrabbing();
  }

  /**
   * Get study by cornerstone image instance.
   *
   * @param {object} image
   * @returns
   */
  getStudy(image) {
    const StudyInstanceUID = cornerstone.metaData.get(
      'StudyInstanceUID',
      image.imageId
    );
    const studies = studyMetadataManager.all();
    return studies.find(
      study => study.getData().StudyInstanceUID === StudyInstanceUID
    );
  }

  /**
   * Get study series by cornerstone image instance.
   *
   * @param {object} study OHIF study instance
   * @param {object} image cornerstone image instance object
   * @returns
   */
  getSeries(study, image) {
    const SeriesInstanceUID = cornerstone.metaData.get(
      'SeriesInstanceUID',
      image.imageId
    );
    return study.getSeriesByUID(SeriesInstanceUID);
  }

  /**
   * Get sop instance by cornerstone image instance.
   *
   * @param {array} series
   * @param {object} image
   * @returns
   */
  getInstance(series, image) {
    const instanceMetadata = cornerstone.metaData.get(
      'instance',
      image.imageId
    );
    return series.getInstanceByUID(instanceMetadata.SOPInstanceUID);
  }

  /**
   * Get display set by SOPInstanceUID.
   *
   * @param {array} displaySets
   * @param {object} instance
   * @returns
   */
  getDisplaySetBySOPInstanceUID(displaySets, instance) {
    return displaySets.find(displaySet => {
      return displaySet.images.some(displaySetImage => {
        return displaySetImage.SOPInstanceUID === instance.SOPInstanceUID;
      });
    });
  }

  /**
   * Get active viewport image based on cornerstone viewport element.
   *
   * @param {HTMLElement} element
   * @returns
   */
  getActiveViewportImage(element) {
    if (!element) {
      return;
    }

    const enabledElement = cornerstone.getEnabledElement(element);
    const image = enabledElement.image;

    return image;
  }

  /**
   * Prefetch display sets based on cornerstone viewport element image.
   *
   * @param {HTMLElement} element
   * @returns
   */
  getDisplaySetsToPrefetch(element) {
    const image = this.getActiveViewportImage(element);

    if (!image) {
      return [];
    }

    const study = this.getStudy(image);
    const series = this.getSeries(study, image);
    const instance = this.getInstance(series, image);
    const displaySets = study.displaySets;
    const activeDisplaySet = this.getDisplaySetBySOPInstanceUID(
      displaySets,
      instance
    );

    const prefetchMethodMap = {
      topdown: 'getFirstDisplaySets',
      downward: 'getNextDisplaySets',
      closest: 'getClosestDisplaySets',
      all: 'getAllDisplaySets',
    };

    const prefetchOrder = this.options.order;
    const methodName = prefetchMethodMap[prefetchOrder];
    const getDisplaySets = this[methodName];

    if (!getDisplaySets) {
      if (prefetchOrder) {
        log.warn(`Invalid prefetch order configuration (${prefetchOrder})`);
      }

      return [];
    }

    return getDisplaySets.call(
      this,
      displaySets,
      activeDisplaySet,
      this.options.displaySetCount,
      this.options.includeActiveDisplaySet
    );
  }

  /**
   * Get all display sets.
   *
   * @param {array} displaySets
   * @param {object} activeDisplaySet
   * @param {number} displaySetCount
   * @param {boolean} includeActiveDisplaySet
   * @returns
   */
  getAllDisplaySets(
    displaySets,
    activeDisplaySet,
    displaySetCount,
    includeActiveDisplaySet
  ) {
    const length = displaySets.length;
    const selectedDisplaySets = [];

    for (let i = 0; i < length && displaySetCount; i++) {
      const displaySet = displaySets[i];
      selectedDisplaySets.push(displaySet);
      displaySetCount--;
    }

    return selectedDisplaySets;
  }

  /**
   * Get all display sets in order after the active display set.
   *
   * @param {array} displaySets
   * @param {object} activeDisplaySet
   * @param {number} displaySetCount
   * @param {boolean} includeActiveDisplaySet
   * @returns
   */
  getFirstDisplaySets(
    displaySets,
    activeDisplaySet,
    displaySetCount,
    includeActiveDisplaySet
  ) {
    const length = displaySets.length;
    const selectedDisplaySets = [];

    for (let i = 0; i < length && displaySetCount; i++) {
      const displaySet = displaySets[i];

      if (includeActiveDisplaySet || displaySet !== activeDisplaySet) {
        selectedDisplaySets.push(displaySet);
        displaySetCount--;
      }
    }

    return selectedDisplaySets;
  }

  /**
   * Get all display sets after the active display set.
   *
   * @param {array} displaySets
   * @param {object} activeDisplaySet
   * @param {number} displaySetCount
   * @param {boolean} includeActiveDisplaySet
   * @returns
   */
  getNextDisplaySets(
    displaySets,
    activeDisplaySet,
    displaySetCount,
    includeActiveDisplaySet
  ) {
    const activeDisplaySetIndex = displaySets.indexOf(activeDisplaySet);
    const begin = includeActiveDisplaySet
      ? activeDisplaySetIndex
      : activeDisplaySetIndex + 1;
    const end = Math.min(begin + displaySetCount, displaySets.length);
    return displaySets.slice(begin, end);
  }

  /**
   * Get all display set closest to the active display set.
   *
   * @param {array} displaySets
   * @param {object} activeDisplaySet
   * @param {number} displaySetCount
   * @param {boolean} includeActiveDisplaySet
   * @returns
   */
  getClosestDisplaySets(
    displaySets,
    activeDisplaySet,
    displaySetCount,
    includeActiveDisplaySet
  ) {
    const activeDisplaySetIndex = displaySets.indexOf(activeDisplaySet);
    const length = displaySets.length;
    const selectedDisplaySets = [];
    let left = activeDisplaySetIndex - 1;
    let right = activeDisplaySetIndex + 1;

    if (includeActiveDisplaySet) {
      selectedDisplaySets.push(displaySets[activeDisplaySetIndex]);
    }

    while ((left >= 0 || right < length) && displaySetCount) {
      if (left >= 0) {
        selectedDisplaySets.push(displaySets[left]);
        displaySetCount--;
        left--;
      }

      if (right < length && displaySetCount) {
        selectedDisplaySets.push(displaySets[right]);
        displaySetCount--;
        right++;
      }
    }

    return selectedDisplaySets;
  }

  /**
   * Get all image ids from display sets.
   *
   * @param {array} displaySets
   * @returns {array} image ids
   */
  getImageIdsFromDisplaySets(displaySets) {
    let imageIds = [];

    displaySets.forEach(displaySet => {
      imageIds = imageIds.concat(this.getImageIdsFromDisplaySet(displaySet));
    });

    return imageIds;
  }

  /**
   * Get all image ids from a given display set.
   *
   * @param {array} displaySet
   * @returns
   */
  getImageIdsFromDisplaySet(displaySet) {
    const imageIds = [];

    // TODO: This duplicates work done by the stack manager
    displaySet.images.forEach(image => {
      const numFrames = image.numFrames;
      if (numFrames > 1) {
        for (let i = 0; i < numFrames; i++) {
          let imageId = getImageId(image, i);
          imageIds.push(imageId);
        }
      } else {
        let imageId = getImageId(image);
        imageIds.push(imageId);
      }
    });

    return imageIds;
  }

  /**
   * Filter cached image ids from a set of image ids.
   *
   * @param {array} imageIds
   * @returns {array} images not cached
   */
  filterCachedImageIds(imageIds) {
    return imageIds.filter(imageId => !this.isImageCached(imageId));
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

  /**
   * Warns that cache is full and stops prefetching.
   */
  cacheFullHandler = () => {
    log.warn('Cache full');
    this.stopPrefetching();
  };
}
