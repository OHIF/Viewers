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
    Session.set(progressSessionId, undefined)
    delete Session.keys.progressSessionId;
  }

  destroy() {
    this.stopListening();
    this._clearSession();
  }

  static getNewId() {
    const timeSlice = (new Date()).getTime().toString().slice(-8);
    const randomNumber = parseInt(Math.random() * 1000000000000);

    return timeSlice.toString() + randomNumber.toString();
  }
}

class DICOMFileLoadingListener extends BaseLoadingListener {
  constructor(stack) {
    super(stack);
  }
}

class StackLoadingListener extends BaseLoadingListener {
  constructor(stack) {
    super(stack);
    this.remainingImageIds = stack.imageIds.slice();
    this.loadedImageIds = [];
  }

  getImageLoadedEventName() {
    return 'CornerstoneImageLoaded.' + this.id;
  }

  getImageCachePromiseRemoveEventName() {
    return 'CornerstoneImageCachePromiseRemoved.' + this.id;
  }

  startListening() {
    const imageLoadedEventName = this.getImageLoadedEventName();
    const imageCachePromiseRemovedEventName = this.getImageCachePromiseRemoveEventName();

    this.stopListening();

    $(cornerstone).on(imageLoadedEventName, (e, eventData) => {
      this._imageLoadedEventHandle(e, eventData);
    });

    $(cornerstone).on(imageCachePromiseRemovedEventName, (e, eventData) => {
      this._imageCachePromiseRemovedEventHandle(e, eventData);
    });
  }

  stopListening() {
    const imageLoadedEventName = this.getImageLoadedEventName();
    const imageCachePromiseRemovedEventName = this.getImageCachePromiseRemoveEventName();

    $(cornerstone).off(imageLoadedEventName);
    $(cornerstone).off(imageCachePromiseRemovedEventName);
  }

  _hasImageId(imageId) {
    return this.stack.imageIds.indexOf(imageId) !== -1;
  }

  _moveImageId(imageId, srcImageIds, dstImageIds) {
    const imageIdIndex = srcImageIds.indexOf(imageId);

    if(imageIdIndex === -1) {
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
    const percentComplete = loadedImagesCount / (totalImagesCount);
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

  addStack(stack) {
    const displaySetInstanceUid = stack.displaySetInstanceUid;

    if (!this.listeners[displaySetInstanceUid]) {
      listener = this._createListener(stack);
      if (listener) {
        this.listeners[displaySetInstanceUid] = listener;
      }
    }
  }

  addStudy(study) {
    study.displaySets.forEach(displaySet => {
      const stack = OHIF.viewerbase.stackManager.findOrCreateStack(study, displaySet);
      this.addStack(stack);
    });
  }

  addStudies(studies) {
    if(!studies || !studies.length) {
      return;
    }

    for(let i = 0; i < studies.length; i++) {
      this.addStudy(studies[i]);
    }
  }

  clear() {
    const displaySetInstanceUids = Object.keys(this.listeners);
    const length = displaySetInstanceUids.length;

    for(let i = 0; i < length; i++) {
      const displaySetInstanceUid = displaySetInstanceUids[i];
      const displaySet = this.listeners[displaySetInstanceUid]
      displaySet.destroy();
    }

    this.listener = {};
  }

  _createListener(stack) {
    const schema = this._getSchema(stack);

    if(schema === 'wadors') {
      return new StackLoadingListener(stack);
    }
  }

  _getSchema(stack) {
    const imageId = stack.imageIds[0];
    const colonIndex = imageId.indexOf(":");
    return imageId.substring(0, colonIndex);
  }
}

const studyLoadingListener = new StudyLoadingListener();

export { studyLoadingListener };