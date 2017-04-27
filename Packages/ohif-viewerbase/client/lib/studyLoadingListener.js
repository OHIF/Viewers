import { $ } from 'meteor/jquery';
import { Session } from 'meteor/session';

class BaseLoadingListener {
    constructor(stack) {
        this.id = BaseLoadingListener.getNewId();
        this.stack = stack;
        this.startListening();
    }

    _getProgressSessionId() {
        const displaySetInstanceUid = this.stack.displaySetInstanceUid;
        return 'DisplaySetProgress:' + displaySetInstanceUid;
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
        this.dataSetUrls = this._getDataSetUrls(stack);
    }

    _getImageLoadProgressEventName() {
        return 'CornerstoneImageLoadProgress.' + this.id;
    }

    startListening() {
        const imageLoadProgressEventName = this._getImageLoadProgressEventName();

        this.stopListening();

        $(cornerstone).on(imageLoadProgressEventName, (e, eventData) => {
            this._imageLoadProgressEventHandle(e, eventData);
        });
    }

    stopListening() {
        const imageLoadProgressEventName = this._getImageLoadProgressEventName();
        $(cornerstone).off(imageLoadProgressEventName);
    }

    _imageLoadProgressEventHandle(e, eventData) {
        const dataSetUrl = this._getDataSetUrl(eventData.imageId);

        if (!this.dataSetUrls.has(dataSetUrl)) {
            return;
        }

        this._triggerProgress(eventData);
    }

    _triggerProgress(eventData) {
        const progressSessionId = this._getProgressSessionId();

        Session.set(progressSessionId, {
            percentComplete: eventData.percentComplete,
            bytesLoaded: eventData.loaded,
            bytesTotal: eventData.total
        });
    }

    _getDataSetUrl(imageId) {
        // Remove "frame=999&" from the imageId
        imageId = imageId.replace(/frame=\d+&?/i, '');

        // Remove the last "&" like in "dicomweb:...&serverId=GQGpJcb4CnYDdu53q&"
        imageId = imageId.replace(/&$/, '');

        return imageId;
    }

    _getDataSetUrls(stack) {
        const dataSetUrls = new Set();
        const imageIds = stack.imageIds;
        const length = stack.imageIds.length;

        for (let i = 0; i < length; i++) {
            const dataSetUrl = this._getDataSetUrl(imageIds[i]);
            dataSetUrls.add(dataSetUrl);
        }

        return dataSetUrls;
    }
}

class StackLoadingListener extends BaseLoadingListener {
    constructor(stack) {
        super(stack);
        this.remainingImageIds = stack.imageIds.slice();
        this.loadedImageIds = [];
    }

    _getImageLoadedEventName() {
        return 'CornerstoneImageLoaded.' + this.id;
    }

    _getImageCachePromiseRemoveEventName() {
        return 'CornerstoneImageCachePromiseRemoved.' + this.id;
    }

    startListening() {
        const imageLoadedEventName = this._getImageLoadedEventName();
        const imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

        this.stopListening();

        $(cornerstone).on(imageLoadedEventName, (e, eventData) => {
            this._imageLoadedEventHandle(e, eventData);
        });

        $(cornerstone).on(imageCachePromiseRemovedEventName, (e, eventData) => {
            this._imageCachePromiseRemovedEventHandle(e, eventData);
        });
    }

    stopListening() {
        const imageLoadedEventName = this._getImageLoadedEventName();
        const imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

        $(cornerstone).off(imageLoadedEventName);
        $(cornerstone).off(imageCachePromiseRemovedEventName);
    }

    _moveImageId(imageId, srcImageIds, dstImageIds) {
        const imageIdIndex = srcImageIds.indexOf(imageId);

        if (imageIdIndex === -1) {
            return;
        }

        dstImageIds.push(imageId);
        srcImageIds.splice(imageIdIndex, 1);
        this._triggerProgress();
    }

    _imageLoadedEventHandle(e, eventData) {
        const imageId = eventData.image.imageId;
        this._moveImageId(imageId, this.remainingImageIds, this.loadedImageIds);
    }

    _imageCachePromiseRemovedEventHandle(e, eventData) {
        const imageId = eventData.imageId;
        this._moveImageId(imageId, this.loadedImageIds, this.remainingImageIds);
    }

    _triggerProgress() {
        const loadedImagesCount = this.loadedImageIds.length;
        const remainingImagesCount = this.remainingImageIds.length;
        const totalImagesCount = loadedImagesCount + remainingImagesCount;
        const percentComplete = Math.round(loadedImagesCount / totalImagesCount * 100);
        const progressSessionId = this._getProgressSessionId();

        Session.set(progressSessionId, {
            totalImagesCount,
            loadedImagesCount,
            remainingImagesCount,
            percentComplete
        });
    }
}

class StudyLoadingListener {
    constructor() {
        this.listeners = {};
    }

    addStack(stack, options) {
        const displaySetInstanceUid = stack.displaySetInstanceUid;

        if (!this.listeners[displaySetInstanceUid]) {
            listener = this._createListener(stack, options);
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

    _createListener(stack, options) {
        const schema = this._getSchema(stack);

        if ((schema === 'wadors') || !options.isMultiFrame) {
            return new StackLoadingListener(stack);
        } else if ((schema === 'dicomweb') || (schema === 'wadouri')) {
            return new DICOMFileLoadingListener(stack);
        }
    }

    _getSchema(stack) {
        const imageId = stack.imageIds[0];
        const colonIndex = imageId.indexOf(':');
        return imageId.substring(0, colonIndex);
    }
}

// Singleton
const studyLoadingListener = new StudyLoadingListener();

export { studyLoadingListener };
