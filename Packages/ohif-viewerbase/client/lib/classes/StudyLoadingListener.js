import { $ } from 'meteor/jquery';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneWADOImageLoader } from 'meteor/ohif:cornerstone';

class BaseLoadingListener {
    constructor(stack, options) {
        options = options || {};

        this.id = BaseLoadingListener.getNewId();
        this.stack = stack;
        this.startListening();
        this.statsItemsLimit = options.statsItemsLimit || 2;
        this.stats = {
            items: [],
            total: 0,
            elapsedTime: 0,
            speed: 0
        };

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
            date
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
            stats.elapsedTime = (newItem.date.getTime() - oldestItem.date.getTime()) / 1000;
            stats.speed = (stats.total - oldestItem.value) / stats.elapsedTime;
        }
    }

    _getProgressSessionId() {
        const displaySetInstanceUid = this.stack.displaySetInstanceUid;
        return 'StackProgress:' + displaySetInstanceUid;
    }

    _clearSession() {
        const progressSessionId = this._getProgressSessionId();
        Session.set(progressSessionId, undefined);
        delete Session.keys.progressSessionId;
    }

    startListening() {
        throw new Error('`startListening` must be implemented by child clases');
    }

    stopListening() {
        throw new Error('`stopListening` must be implemented by child clases');
    }

    destroy() {
        this.stopListening();
        this._clearSession();
    }

    static getNewId() {
        const timeSlice = (new Date()).getTime().toString().slice(-8);
        const randomNumber = parseInt(Math.random() * 1000000000);

        return timeSlice.toString() + randomNumber.toString();
    }
}

class DICOMFileLoadingListener extends BaseLoadingListener {
    constructor(stack) {
        super(stack);
        this._dataSetUrl = this._getDataSetUrl(stack);
        this._lastLoaded = 0;

        // Check how many instances has already been download (cached)
        this._checkCachedData();
    }

    _checkCachedData() {
        const dataSet = cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.get(this._dataSetUrl);

        if (dataSet) {
            const dataSetLength = dataSet.byteArray.length;

            this._updateProgress({
                percentComplete: 100,
                loaded: dataSetLength,
                total: dataSetLength
            });
        }
    }

    _getImageLoadProgressEventName() {
        return 'cornerstoneimageloadprogress.' + this.id;
    }

    startListening() {
        const imageLoadProgressEventName = this._getImageLoadProgressEventName();
        const imageLoadProgressEventHandle = this._imageLoadProgressEventHandle.bind(this);

        this.stopListening();

        cornerstone.events.addEventListener(imageLoadProgressEventName, imageLoadProgressEventHandle);
    }

    stopListening() {
        const imageLoadProgressEventName = this._getImageLoadProgressEventName();
        cornerstone.events.removeEventListener(imageLoadProgressEventName);
    }

    _imageLoadProgressEventHandle(e) {
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
    }

    _updateProgress(eventData) {
        const progressSessionId = this._getProgressSessionId();
        eventData = eventData || {};

        Session.set(progressSessionId, {
            multiFrame: false,
            percentComplete: eventData.percentComplete,
            bytesLoaded: eventData.loaded,
            bytesTotal: eventData.total,
            bytesPerSecond: this.stats.speed
        });
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

class StackLoadingListener extends BaseLoadingListener {
    constructor(stack) {
        super(stack, { statsItemsLimit: 20 });
        this.imageDataMap = this._convertImageIdsArrayToMap(stack.imageIds);
        this.framesStatus = this._createArray(stack.imageIds.length, false);
        this.loadedCount = 0;

        // Check how many instances has already been download (cached)
        this._checkCachedData();
    }

    _convertImageIdsArrayToMap(imageIds) {
        const imageIdsMap = new Map();

        for (let i = 0; i < imageIds.length; i++) {
            imageIdsMap.set(imageIds[i], {
                index: i,
                loaded: false
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

    _checkCachedData() {
        // const imageIds = this.stack.imageIds;

        // TODO: No way to check status of Promise.
        /*for(let i = 0; i < imageIds.length; i++) {
            const imageId = imageIds[i];

            const imagePromise = cornerstone.imageCache.getImageLoadObject(imageId).promise;

            if (imagePromise && (imagePromise.state() === 'resolved')) {
                this._updateFrameStatus(imageId, true);
            }
        }*/
    }

    _getImageLoadedEventName() {
        return 'cornerstoneimageloaded.' + this.id;
    }

    _getImageCachePromiseRemoveEventName() {
        return 'cornerstoneimagecachepromiseremoved.' + this.id;
    }

    startListening() {
        const imageLoadedEventName = this._getImageLoadedEventName();
        const imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();
        const imageLoadedEventHandle = this._imageLoadedEventHandle.bind(this);
        const imageCachePromiseRemovedEventHandle = this._imageCachePromiseRemovedEventHandle.bind(this);

        this.stopListening();

        cornerstone.events.addEventListener(imageLoadedEventName, imageLoadedEventHandle);
        cornerstone.events.addEventListener(imageCachePromiseRemovedEventName, imageCachePromiseRemovedEventHandle);
    }

    stopListening() {
        const imageLoadedEventName = this._getImageLoadedEventName();
        const imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

        cornerstone.events.removeEventListener(imageLoadedEventName);
        cornerstone.events.removeEventListener(imageCachePromiseRemovedEventName);
    }

    _updateFrameStatus(imageId, loaded) {
        const imageData = this.imageDataMap.get(imageId);

        if (!imageData || (imageData.loaded === loaded)) {
            return;
        }

        // Add one more frame to the stats
        if (loaded) {
            this._addStatsData(1);
        }

        imageData.loaded = loaded;
        this.framesStatus[imageData.index] = loaded;
        this.loadedCount += loaded ? 1 : -1;
        this._updateProgress();
    }

    _imageLoadedEventHandle(e) {
        this._updateFrameStatus(e.detail.image.imageId, true);
    }

    _imageCachePromiseRemovedEventHandle(e) {
        this._updateFrameStatus(e.detail.imageId, false);
    }

    _updateProgress() {
        const totalFramesCount = this.stack.imageIds.length;
        const loadedFramesCount = this.loadedCount;
        const loadingFramesCount = totalFramesCount - loadedFramesCount;
        const percentComplete = Math.round(loadedFramesCount / totalFramesCount * 100);
        const progressSessionId = this._getProgressSessionId();

        Session.set(progressSessionId, {
            multiFrame: true,
            totalFramesCount,
            loadedFramesCount,
            loadingFramesCount,
            percentComplete,
            framesPerSecond: this.stats.speed,
            framesStatus: this.framesStatus
        });
    }

    _logProgress() {
        const totalFramesCount = this.stack.imageIds.length;
        const displaySetInstanceUid = this.stack.displaySetInstanceUid;
        let progressBar = '[';

        for (let i = 0; i < totalFramesCount; i++) {
            const ch = this.framesStatus[i] ? '|' : '.';
            progressBar += `${ch}`;
        }

        progressBar += ']';
        OHIF.log.info(`${displaySetInstanceUid}: ${progressBar}`);
    }
}

class StudyLoadingListener {
    constructor() {
        this.listeners = {};
    }

    addStack(stack, stackMetaData) {
        const displaySetInstanceUid = stack.displaySetInstanceUid;

        if (!this.listeners[displaySetInstanceUid]) {
            const listener = this._createListener(stack, stackMetaData);
            if (listener) {
                this.listeners[displaySetInstanceUid] = listener;
            }
        }
    }

    addStudy(study) {
        study.displaySets.forEach(displaySet => {
            const stack = OHIF.viewerbase.stackManager.findOrCreateStack(study, displaySet);
            this.addStack(stack, {
                isMultiFrame: displaySet.isMultiFrame
            });
        });
    }

    addStudies(studies) {
        if (!studies || !studies.length) {
            return;
        }

        for (let i = 0; i < studies.length; i++) {
            this.addStudy(studies[i]);
        }
    }

    clear() {
        const displaySetInstanceUids = Object.keys(this.listeners);
        const length = displaySetInstanceUids.length;

        for (let i = 0; i < length; i++) {
            const displaySetInstanceUid = displaySetInstanceUids[i];
            const displaySet = this.listeners[displaySetInstanceUid];

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
        if ((schema === 'wadors') || !stackMetaData.isMultiFrame) {
            return new StackLoadingListener(stack);
        } else {
            return new DICOMFileLoadingListener(stack);
        }
    }

    _getSchema(stack) {
        const imageId = stack.imageIds[0];
        const colonIndex = imageId.indexOf(':');
        return imageId.substring(0, colonIndex);
    }

    // Singleton
    static getInstance() {
        if (!StudyLoadingListener._instance) {
            StudyLoadingListener._instance = new StudyLoadingListener();
        }

        return StudyLoadingListener._instance;
    }
}

export { StudyLoadingListener, StackLoadingListener, DICOMFileLoadingListener };
