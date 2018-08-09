import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { OHIFError } from './OHIFError';
import { StackManager } from '../StackManager.js';
import { getImageId } from '../getImageId.js';

export class StudyPrefetcher {

    constructor(studies) {
        this.studies = studies || [];
        this.prefetchDisplaySetsTimeout = 300;
        this.lastActiveViewportElement = null;
        this.cacheFullHandlerBound = _.bind(this.cacheFullHandler, this);

        cornerstone.events.addEventListener('cornerstoneimagecachefull.StudyPrefetcher', this.cacheFullHandlerBound);
    }

    destroy() {
        this.stopPrefetching();
        cornerstone.events.removeEventListener('cornerstoneimagecachefull.StudyPrefetcher', this.cacheFullHandlerBound);
    }

    static getInstance() {
        if (!StudyPrefetcher.instance) {
            StudyPrefetcher.instance = new StudyPrefetcher();
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
        this.prefetchActiveViewport();
        this.prefetchDisplaySets();
    }

    stopPrefetching() {
        this.disableViewportPrefetch();
        cornerstoneTools.requestPoolManager.clearRequestStack('prefetch');
    }

    prefetchActiveViewport() {
        const activeViewportElement = OHIF.viewerbase.viewportUtils.getActiveViewportElement();
        this.enablePrefetchOnElement(activeViewportElement);
        this.attachActiveViewportListeners(activeViewportElement);
    }

    disableViewportPrefetch() {
        $('.imageViewerViewport').each(function() {
            if (!$(this).find('canvas').length) {
                return;
            }

            cornerstoneTools.stackPrefetch.disable(this);
        });
    }

    hasStack(element) {
        const stack = cornerstoneTools.getToolState(element, 'stack');
        return stack && stack.data.length && (stack.data[0].imageIds.length > 1);
    }

    /**
     * This function enables stack prefetching for a specified element (viewport)
     * It first disables any prefetching currently occurring on any other viewports.
     *
     * @param element {node} DOM Node representing the viewport element
     */
    enablePrefetchOnElement(element) {
        if (!$(element).find('canvas').length) {
            return;
        }

        // Make sure there is a stack to fetch
        if (this.hasStack(element)) {
            // Check if this is a clip or not
            const activeViewportIndex = Session.get('activeViewport');
            const displaySetInstanceUid = OHIF.viewer.data.loadedSeriesData[activeViewportIndex].displaySetInstanceUid;

            const stack = StackManager.findStack(displaySetInstanceUid);

            if (!stack) {
                throw new OHIFError(`Requested stack ${displaySetInstanceUid} was not created`);
            }

            cornerstoneTools.stackPrefetch.enable(element);
        }
    }

    attachActiveViewportListeners(activeViewportElement) {
        function newImageHandler() {
            // It needs to be called asynchronously because cornerstone does it at the same way.
            // All instance urls to be prefetched will be removed again if we add them before
            // Cornerstone callback (see stackPrefetch.onImageUpdated).
            StudyPrefetcher.prefetchDisplaySetsAsync();
        }

        if (this.lastActiveViewportElement) {
            this.lastActiveViewportElement.removeEventListener('cornerstonenewimage.StudyPrefetcher', newImageHandler);
        }

        activeViewportElement.removeEventListener('cornerstonenewimage.StudyPrefetcher', newImageHandler);

        // Cornerstone will not attach an event listener if the element doesn't have a stack
        if (this.hasStack(activeViewportElement)) {
            activeViewportElement.addEventListener('cornerstonenewimage.StudyPrefetcher', newImageHandler);
        }

        this.lastActiveViewportElement = activeViewportElement;
    }

    prefetchDisplaySetsAsync(timeout) {
        timeout = timeout || this.prefetchDisplaySetsTimeout;

        clearTimeout(this.prefetchDisplaySetsHandler);
        this.prefetchDisplaySetsHandler = setTimeout(() => {
            this.prefetchDisplaySets();
        }, timeout);
    }

    prefetchDisplaySets() {
        let config;
        if (Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.prefetch) {
            config = Meteor.settings.public.prefetch;
        } else {
            config = {
                order: 'closest',
                displaySetCount: 1
            };
        }

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
            requestPoolManager.addRequest({}, imageId, requestType, preventCache, noop, noop);
        });

        requestPoolManager.startGrabbing();
    }

    getActiveViewportImage() {
        const element = OHIF.viewerbase.viewportUtils.getActiveViewportElement();

        if (!element) {
            return;
        }

        const enabledElement = cornerstone.getEnabledElement(element);
        const image = enabledElement.image;

        return image;
    }

    getStudy(image) {
        const studyMetadata = cornerstone.metaData.get('study', image.imageId);
        return OHIF.viewer.Studies.find(study => study.studyInstanceUid === studyMetadata.studyInstanceUid);
    }

    getSeries(study, image) {
        const seriesMetadata = cornerstone.metaData.get('series', image.imageId);
        const studyMetadata = OHIF.viewerbase.getStudyMetadata(study);

        return studyMetadata.getSeriesByUID(seriesMetadata.seriesInstanceUid);
    }

    getInstance(series, image) {
        const instanceMetadata = cornerstone.metaData.get('instance', image.imageId);
        return series.getInstanceByUID(instanceMetadata.sopInstanceUid);
    }

    getActiveDisplaySet(displaySets, instance) {
        return _.find(displaySets, displaySet => {
            return _.some(displaySet.images, displaySetImage => {
                return displaySetImage.sopInstanceUid === instance.sopInstanceUid;
            });
        });
    }

    getDisplaySetsToPrefetch(config) {
        const image = this.getActiveViewportImage();

        if (!image || !config || !config.displaySetCount) {
            return [];
        }

        const study = this.getStudy(image);
        const series = this.getSeries(study, image);
        const instance = this.getInstance(series, image);
        const displaySets = study.displaySets;
        const activeDisplaySet = this.getActiveDisplaySet(displaySets, instance);
        const prefetchMethodMap = {
            topdown: 'getFirstDisplaySets',
            downward: 'getNextDisplaySets',
            closest: 'getClosestDisplaySets'
        };

        const prefetchOrder = config.order;
        const methodName = prefetchMethodMap[prefetchOrder];
        const getDisplaySets = this[methodName];

        if (!getDisplaySets) {
            if (prefetchOrder) {
                OHIF.log.warn(`Invalid prefetch order configuration (${prefetchOrder})`);
            }

            return [];
        }

        return getDisplaySets.call(this, displaySets, activeDisplaySet, config.displaySetCount);
    }

    getFirstDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
        const length = displaySets.length;
        const selectedDisplaySets = [];

        for (let i = 0; (i < length) && displaySetCount; i++) {
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

        while (((left >= 0) || (right < length)) && displaySetCount) {
            if (left >= 0) {
                selectedDisplaySets.push(displaySets[left]);
                displaySetCount--;
                left--;
            }

            if ((right < length) && displaySetCount) {
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
        return _.filter(imageIds, imageId => {
            return !this.isImageCached(imageId);
        });
    }

    isImageCached(imageId) {
        const image = cornerstone.imageCache.imageCache[imageId];
        return image && image.sizeInBytes;
    }

    cacheFullHandler() {
        OHIF.log.warn('Cache full');
        this.stopPrefetching();
    }

}
