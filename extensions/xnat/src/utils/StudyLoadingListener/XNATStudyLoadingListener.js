import * as cornerstone from '@cornerstonejs/core'
import debounce from 'lodash.debounce';

const EVENTS = {
  IMAGE_LOAD_PROGRESS: cornerstone.EVENTS.IMAGE_LOAD_PROGRESS,
  IMAGE_LOADED: cornerstone.EVENTS.IMAGE_LOADED,
  IMAGE_LOAD_FAILED: cornerstone.EVENTS.IMAGE_LOAD_FAILED,
  IMAGE_CACHE_PROMISE_REMOVED: cornerstone.EVENTS.IMAGE_CACHE_PROMISE_REMOVED,
};

const DISPLAY_SET_LOADING_STATUS = {
  NOT_LOADED: 0,
  LOADED: 1,
  LOADING: 2,
};

class DisplaySetLoadingListener {
  constructor(displaySet, imageIds, isMultiFrame, setProgressDataCallback) {
    this.dataLoadingProgress = displaySet.dataLoadingProgress;
    this.displaySetInstanceUID = displaySet.displaySetInstanceUID;
    this.imageIds = imageIds;
    this.isMultiFrame = isMultiFrame;
    this.setProgressData = setProgressDataCallback;

    this.imageLoadedEventHandler = this._imageLoadedEventHandler.bind(this);
    this.imageLoadProgressEventHandler = this._imageLoadProgressEventHandler.bind(
      this
    );
  }

  startListening() {
    if (this.isMultiFrame) {
      cornerstone.events.addEventListener(
        `${EVENTS.IMAGE_LOAD_PROGRESS}.${this.displaySetInstanceUID}`,
        this.imageLoadProgressEventHandler
      );
    } else {
      cornerstone.events.addEventListener(
        `${EVENTS.IMAGE_LOADED}.${this.displaySetInstanceUID}`,
        this.imageLoadedEventHandler
      );
    }
  }

  stopListening() {
    if (this.isMultiFrame) {
      cornerstone.events.removeEventListener(
        `${EVENTS.IMAGE_LOAD_PROGRESS}.${this.displaySetInstanceUID}`,
        this.imageLoadProgressEventHandler
      );
    } else {
      cornerstone.events.removeEventListener(
        `${EVENTS.IMAGE_LOADED}.${this.displaySetInstanceUID}`,
        this.imageLoadedEventHandler
      );
    }
  }

  destroy() {
    this.stopListening();
  }

  _imageLoadedEventHandler(evt) {
    if (this.imageIds.includes(evt.detail.image.imageId)) {
      const { loadingStatus, loadedComplete } = this.dataLoadingProgress;

      if (loadingStatus === DISPLAY_SET_LOADING_STATUS.NOT_LOADED) {
        this.dataLoadingProgress.loadingStatus =
          DISPLAY_SET_LOADING_STATUS.LOADING;
      }

      const totalImageCount = this.imageIds.length;
      const loadedImageCount = loadedComplete + 1;

      const percentComplete = Math.floor(
        (loadedImageCount / totalImageCount) * 100
      );

      if (totalImageCount === loadedImageCount) {
        this.dataLoadingProgress.loadingStatus =
          DISPLAY_SET_LOADING_STATUS.LOADED;
      }

      this.dataLoadingProgress.loadedComplete = loadedImageCount;
      this.dataLoadingProgress.percentComplete = percentComplete;

      this.setProgressData(this.displaySetInstanceUID, {
        ...this.dataLoadingProgress,
      });
    }
  }

  _imageLoadProgressEventHandler(evt) {
    // Used for multiframe image data
  }
}

class XNATStudyLoadingListener {
  static events = {
    OnProgress: 'DisplaySetLoadingEvents.OnProgress',
  };

  constructor() {
    this.listeners = new Map();
    this.eventTriggerCallbacks = {
      setProgressData: (progressId, progressData) => {
        const event = new CustomEvent(
          XNATStudyLoadingListener.events.OnProgress,
          {
            detail: { progressId, progressData },
          }
        );
        document.dispatchEvent(event);
      },
    };
  }

  init(studies) {
    this.clear();

    studies.forEach(study => {
      study.displaySets.forEach(displaySet => {
        const displaySetInstanceUID = displaySet.displaySetInstanceUID;
        if (displaySet.isDicomWeb) {
          return;
        }
        const imageIds = displaySet.images.map(image => image._data.url);
        displaySet.dataLoadingProgress = {
          loadingStatus: DISPLAY_SET_LOADING_STATUS.NOT_LOADED,
          loadedComplete: 0, // images loaded, or data loaded if multiframe image
          percentComplete: 0,
        };
        const displaySetLoadingListener = new DisplaySetLoadingListener(
          displaySet,
          imageIds,
          displaySet.isMultiFrame,
          this.eventTriggerCallbacks.setProgressData
        );
        this.listeners.set(displaySetInstanceUID, displaySetLoadingListener);
        displaySetLoadingListener.startListening();
      });
    });
  }

  clear() {
    Array.from(this.listeners.values()).forEach(listener => listener.destroy());
    this.listeners.clear();
  }

  static getInstance() {
    if (!XNATStudyLoadingListener._instance) {
      XNATStudyLoadingListener._instance = new XNATStudyLoadingListener();
    }

    return XNATStudyLoadingListener._instance;
  }
}

export { XNATStudyLoadingListener, DISPLAY_SET_LOADING_STATUS };
