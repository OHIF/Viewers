import log from '../log.js';
import OHIFError from './OHIFError';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import getImageId from '../utils/getImageId.js';

export class StudyPrefetcher {
  constructor(studies) {
    this.studies = studies || [];
    this.prefetchDisplaySetsTimeout = 300;
    this.lastActiveViewportElement = null;

    cornerstone.events.addEventListener(
      'cornerstoneimagecachefull.StudyPrefetcher',
      this.cacheFullHandler
    );
  }

  destroy() {
    this.stopPrefetching();
    cornerstone.events.removeEventListener(
      'cornerstoneimagecachefull.StudyPrefetcher',
      this.cacheFullHandler
    );
  }

  static getInstance() {
    if (!StudyPrefetcher.instance) {
      StudyPrefetcher.instance = new StudyPrefetcher([]);
    }

    return StudyPrefetcher.instance;
  }

  setStudies(studies) {
    this.stopPrefetching();
    this.studies = studies;
  }

  prefetch() {
    if (!this.studies || !this.studies.length) {
      return;
    }

    this.stopPrefetching();
    this.prefetchDisplaySets();
  }

  stopPrefetching() {
    cornerstoneTools.requestPoolManager.clearRequestStack('prefetch');
  }

  prefetchDisplaySetsAsync(timeout) {
    timeout = timeout || this.prefetchDisplaySetsTimeout;

    clearTimeout(this.prefetchDisplaySetsHandler);
    this.prefetchDisplaySetsHandler = setTimeout(() => {
      this.prefetchDisplaySets();
    }, timeout);
  }

  prefetchDisplaySets() {
    // TODO: Allow passing in config
    let config = {
      order: 'closest',
      displaySetCount: 1,
    };

    const displaySetsToPrefetch = this.getDisplaySetsToPrefetch(config);
    const imageIds = this.getImageIdsFromDisplaySets(displaySetsToPrefetch);

    this.prefetchImageIds(imageIds);
  }

  prefetchImageIds(imageIds) {
    const nonCachedImageIds = this.filterCachedImageIds(imageIds);
    const requestPoolManager = cornerstoneTools.requestPoolManager;
    const requestType = 'prefetch';
    const preventCache = false;
    const noop = () => {};

    nonCachedImageIds.forEach(imageId => {
      requestPoolManager.addRequest(
        {},
        imageId,
        requestType,
        preventCache,
        noop,
        noop
      );
    });

    requestPoolManager.startGrabbing();
  }

  getStudy(image) {
    const StudyInstanceUID = cornerstone.metaData.get(
      'StudyInstanceUID',
      image.imageId
    );
    return OHIF.viewer.Studies.find(
      study => study.StudyInstanceUID === StudyInstanceUID
    );
  }

  getSeries(study, image) {
    const SeriesInstanceUID = cornerstone.metaData.get(
      'SeriesInstanceUID',
      image.imageId
    );
    const studyMetadata = OHIF.viewerbase.getStudyMetadata(study);

    return studyMetadata.getSeriesByUID(SeriesInstanceUID);
  }

  getInstance(series, image) {
    const instanceMetadata = cornerstone.metaData.get(
      'instance',
      image.imageId
    );
    return series.getInstanceByUID(instanceMetadata.SOPInstanceUID);
  }

  getActiveDisplaySet(displaySets, instance) {
    return displaySets.find(displaySet => {
      return displaySet.images.some(displaySetImage => {
        return displaySetImage.SOPInstanceUID === instance.SOPInstanceUID;
      });
    });
  }

  getDisplaySetsToPrefetch(config) {
    const image = this.getActiveViewportImage();

    if (!image || !config || !config.displaySetCount) {
      return [];
    }

    /*const study = this.getStudy(image);
    const series = this.getSeries(study, image);
    const instance = this.getInstance(series, image);*/
    const displaySets = study.displaySets;
    const activeDisplaySet = null; //this.getActiveDisplaySet(displaySets, instance);
    const prefetchMethodMap = {
      topdown: 'getFirstDisplaySets',
      downward: 'getNextDisplaySets',
      closest: 'getClosestDisplaySets',
    };

    const prefetchOrder = config.order;
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
      config.displaySetCount
    );
  }

  getFirstDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
    const length = displaySets.length;
    const selectedDisplaySets = [];

    for (let i = 0; i < length && displaySetCount; i++) {
      const displaySet = displaySets[i];

      if (displaySet !== activeDisplaySet) {
        selectedDisplaySets.push(displaySet);
        displaySetCount--;
      }
    }

    return selectedDisplaySets;
  }

  getNextDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
    const activeDisplaySetIndex = displaySets.indexOf(activeDisplaySet);
    const begin = activeDisplaySetIndex + 1;
    const end = Math.min(begin + displaySetCount, displaySets.length);

    return displaySets.slice(begin, end);
  }

  getClosestDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
    const activeDisplaySetIndex = displaySets.indexOf(activeDisplaySet);
    const length = displaySets.length;
    const selectedDisplaySets = [];
    let left = activeDisplaySetIndex - 1;
    let right = activeDisplaySetIndex + 1;

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

  getImageIdsFromDisplaySets(displaySets) {
    let imageIds = [];

    displaySets.forEach(displaySet => {
      imageIds = imageIds.concat(this.getImageIdsFromDisplaySet(displaySet));
    });

    return imageIds;
  }

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

  filterCachedImageIds(imageIds) {
    return imageIds.filter(imageId => !this.isImageCached(imageId));
  }

  isImageCached(imageId) {
    const image = cornerstone.imageCache.imageCache[imageId];
    return image && image.sizeInBytes;
  }

  cacheFullHandler = () => {
    log.warn('Cache full');
    this.stopPrefetching();
  };
}
