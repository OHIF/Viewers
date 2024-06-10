import { cache, imageLoadPoolManager, imageLoader, Enums } from '@cornerstonejs/core';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import { ExtensionManager } from '../../extensions';
import ServicesManager from '../ServicesManager';
import ViewportGridService from '../ViewportGridService';
import { DisplaySet } from '../../types';

const IMAGE_REQUEST_TYPE = 'prefetch';

export const EVENTS = {
  SERVICE_STARTED: 'event::studyPrefetcherService:started',
  SERVICE_STOPPED: 'event::studyPrefetcherService:stopped',
  DISPLAYSET_LOAD_PROGRESS: 'event::studyPrefetcherService:displaySetLoadProgress',
  DISPLAYSET_LOAD_COMPLETE: 'event::studyPrefetcherService:displaySetLoadComplete',
};

enum StudyPrefetchOrder {
  closest = 'closest',
  downward = 'downward',
  upward = 'upward',
}

type StudyPrefetchConfig = {
  enabled: boolean;
  displaySetCount: number;
  maxNumPrefetchRequests: number;
  order: StudyPrefetchOrder;
};

type DisplaySetStatus = {
  displaySetInstanceUID: string;
  numImages: number;
  pendingImageIds: Set<string>;
  loadedImageIds: Set<string>;
  failedImageIds: Set<string>;
};

type ImageRequest = {
  displaySetInstanceUID: string;
  imageId: string;
  aborted: boolean;
};

type PubSubServiceSubscription = { unsubscribe: () => any };

class StudyPrefetcherService extends PubSubService {
  private _extensionManager: ExtensionManager;
  private _servicesManager: ServicesManager;
  private _subscriptions: PubSubServiceSubscription[];
  private _activeDisplaySetsInstanceUIDs: string[] = [];
  private _pendingRequests: ImageRequest[] = [];
  private _inflightRequests = new Map<string, ImageRequest>();
  private _isRunning = false;
  private _displaySetLoadingStates = new Map<string, DisplaySetStatus>();
  private config: StudyPrefetchConfig = {
    /* Enable/disable study prefetching service */
    enabled: true,
    /* number of displaysets to be prefetched */
    displaySetCount: 2,
    /**
     * Max number of concurrent prefetch requests
     * High numbers may impact on the time to load a new dropped series because
     * the browser will be busy with all prefetching requests. As soon as the
     * prefetch requests get fulfilled the new ones from the new dropped series
     * are sent to the server.
     *
     * TODO: abort all prefetch requests when a new series is loaded on a viewport.
     * (need to add support for `AbortController` on Cornerstone)
     * */
    maxNumPrefetchRequests: 10,
    /* Display sets loading order (closest, top-bottom or bottom-up) */
    order: StudyPrefetchOrder.downward,
  };

  public static REGISTRATION = {
    name: 'studyPrefetcherService',
    altName: 'StudyPrefetcherService',
    create: ({ configuration, servicesManager, extensionManager }): StudyPrefetcherService => {
      return new StudyPrefetcherService({
        servicesManager,
        extensionManager,
        configuration,
      });
    },
  };

  constructor({
    servicesManager,
    extensionManager,
    configuration,
  }: {
    servicesManager: ServicesManager;
    extensionManager: ExtensionManager;
    configuration: StudyPrefetchConfig;
  }) {
    super(EVENTS);

    this._servicesManager = servicesManager;
    this._extensionManager = extensionManager;
    this._subscriptions = [];

    Object.assign(this.config, configuration);
  }

  public onModeEnter(): void {
    this.addEventListeners();
  }

  /**
   * The onModeExit returns the service to the initial state.
   */
  public onModeExit(): void {
    this._removeEventListeners();
    this._stopPrefetching();
  }

  private addEventListeners() {
    const { viewportGridService } = this._servicesManager.services;

    // Loads new datasets when making a new viewport active
    const viewportGridActiveViewportIdSubscription = viewportGridService.subscribe(
      ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      ({ viewportId }) => this._syncWithActiveViewport(viewportId)
    );

    // Continue loading datasets after changing the layout (eg: from 1x1 to 2x1)
    const viewportGridLayoutChangedSubscription = viewportGridService.subscribe(
      ViewportGridService.EVENTS.LAYOUT_CHANGED,
      () => this._syncWithActiveViewport()
    );

    // Loads new datasets after loading a new display set on a viewport
    const viewportGridStateChangedSubscription = viewportGridService.subscribe(
      ViewportGridService.EVENTS.GRID_STATE_CHANGED,
      () => this._syncWithActiveViewport()
    );

    // Loads the first datasets right after opening the viewer
    const viewportGridViewportreadySubscription = viewportGridService.subscribe(
      ViewportGridService.EVENTS.VIEWPORTS_READY,
      () => {
        this._syncWithActiveViewport();
        this._startPrefetching();
      }
    );

    this._subscriptions.push(
      viewportGridActiveViewportIdSubscription,
      viewportGridLayoutChangedSubscription,
      viewportGridStateChangedSubscription,
      viewportGridViewportreadySubscription
    );
  }

  private _removeEventListeners() {
    this._subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private _syncWithActiveViewport(activeViewportId?) {
    const { viewportGridService } = this._servicesManager.services;
    const viewportGridServiceState = viewportGridService.getState();
    const { viewports } = viewportGridServiceState;

    activeViewportId = activeViewportId ?? viewportGridServiceState.activeViewportId;

    // If may be null when the viewer is loaded
    if (!activeViewportId) {
      return;
    }

    const activeViewport = viewports.get(activeViewportId);
    const displaySetUpdated = this._setActiveDisplaySetsUIDs(activeViewport.displaySetInstanceUIDs);

    if (displaySetUpdated) {
      this._restartPrefetching();
    }
  }

  private _getDisplaySets() {
    const { displaySetService, hangingProtocolService } = this._servicesManager.services;
    const fnSort = hangingProtocolService.getDisplaySetSortFunction();
    const displaySets = [...displaySetService.getActiveDisplaySets()];

    return displaySets.sort(fnSort);
  }

  private _setActiveDisplaySetsUIDs(newActiveDisplaySetInstanceUIDs: string[]): boolean {
    const sameDisplaySets =
      newActiveDisplaySetInstanceUIDs.length === this._activeDisplaySetsInstanceUIDs.length &&
      newActiveDisplaySetInstanceUIDs.every(uid =>
        this._activeDisplaySetsInstanceUIDs.includes(uid)
      );

    if (sameDisplaySets) {
      return false;
    }

    this._activeDisplaySetsInstanceUIDs = [...newActiveDisplaySetInstanceUIDs];
    this._restartPrefetching();

    return true;
  }

  private _getDisplaySetSortedByClosest(displaySets: DisplaySet[], activeDisplaySetIndex: number) {
    const sortedDisplaySets = [];
    let previousIndex = activeDisplaySetIndex - 1;
    let nextIndex = activeDisplaySetIndex + 1;

    while (previousIndex >= 0 || nextIndex < displaySets.length) {
      if (previousIndex >= 0) {
        sortedDisplaySets.push(displaySets[previousIndex]);
        previousIndex--;
      }

      if (nextIndex < displaySets.length) {
        sortedDisplaySets.push(displaySets[nextIndex]);
        nextIndex++;
      }
    }

    return sortedDisplaySets;
  }

  private _getDisplaySetSortedByDownward(displaySets: DisplaySet[], activeDisplaySetIndex: number) {
    const sortedDisplaySets = [];
    const numDisplaySets = displaySets.length;
    let nextIndex = (activeDisplaySetIndex + 1) % numDisplaySets;

    while (nextIndex !== activeDisplaySetIndex) {
      sortedDisplaySets.push(displaySets[nextIndex]);
      nextIndex = (nextIndex + 1) % numDisplaySets;
    }

    return sortedDisplaySets;
  }

  private _getDisplaySetSortedByUpward(displaySets: DisplaySet[], activeDisplaySetIndex: number) {
    const sortedDisplaySets = [];
    const numDisplaySets = displaySets.length;
    let nextIndex = (activeDisplaySetIndex - 1 + numDisplaySets) % numDisplaySets;

    while (nextIndex !== activeDisplaySetIndex) {
      sortedDisplaySets.push(displaySets[nextIndex]);
      nextIndex = (nextIndex - 1 + numDisplaySets) % numDisplaySets;
    }

    return sortedDisplaySets;
  }

  private _getSortedDisplaySets(): DisplaySet[] {
    if (!this._activeDisplaySetsInstanceUIDs) {
      return [];
    }

    const activeDisplaySetUIDs = this._activeDisplaySetsInstanceUIDs;
    const displaySets = this._getDisplaySets();
    const activeDisplaySetIndex = this._activeDisplaySetsInstanceUIDs.length
      ? displaySets.findIndex(ds => ds.displaySetInstanceUID === activeDisplaySetUIDs[0])
      : -1;
    const sortingMethods = {
      [StudyPrefetchOrder.closest]: this._getDisplaySetSortedByClosest,
      [StudyPrefetchOrder.downward]: this._getDisplaySetSortedByDownward,
      [StudyPrefetchOrder.upward]: this._getDisplaySetSortedByUpward,
    };
    const { order } = this.config;
    const fnSort = sortingMethods[order];

    if (!fnSort) {
      throw new Error(`Invalid sorting order (${order})`);
    }

    return fnSort.call(this, displaySets, activeDisplaySetIndex);
  }

  private _getSortedDisplaySetsToPrefetch(): DisplaySet[] {
    const { displaySetCount } = this.config;
    const activeDisplaySetsInstanceUIDs = new Set(this._activeDisplaySetsInstanceUIDs);

    // Needs to filter to make sure loaded displaySets will not be in the array
    // (eg: viewports with two displaySets loaded)
    const displaySets = this._getSortedDisplaySets().filter(
      ds => !activeDisplaySetsInstanceUIDs.has(ds.displaySetInstanceUID)
    );

    return displaySets.slice(0, displaySetCount);
  }

  private _moveImageIdToLoadedSet({ displaySetInstanceUID, imageId }) {
    const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);
    const { pendingImageIds, loadedImageIds } = displaySetLoadingState;

    pendingImageIds.delete(imageId);
    loadedImageIds.add(imageId);
  }

  private _moveImageIdToFailedSet({ displaySetInstanceUID, imageId }) {
    const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);
    const { pendingImageIds, failedImageIds } = displaySetLoadingState;

    pendingImageIds.delete(imageId);
    failedImageIds.add(imageId);
  }

  private _onImageLoadComplete(imageRequest) {
    if (imageRequest.aborted) {
      return;
    }

    const { displaySetInstanceUID, imageId } = imageRequest;
    const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);
    const { numImages, loadedImageIds, failedImageIds } = displaySetLoadingState;
    const loadingProgress = (loadedImageIds.size + failedImageIds.size) / numImages;

    this._inflightRequests.delete(imageId);
    this._broadcastEvent(this.EVENTS.DISPLAYSET_LOAD_PROGRESS, {
      displaySetInstanceUID,
      numImages,
      loadingProgress: (loadedImageIds.size + failedImageIds.size) / numImages,
    });

    if (loadingProgress >= 1) {
      this._broadcastEvent(this.EVENTS.DISPLAYSET_LOAD_COMPLETE, {
        displaySetInstanceUID,
      });
    }

    this._sendNextRequests();
  }

  private _onImageLoadSuccess(imageRequest, _image) {
    if (imageRequest.aborted) {
      return;
    }

    this._moveImageIdToLoadedSet(imageRequest);
    this._onImageLoadComplete(imageRequest);
  }

  private _onImageLoadError(imageRequest, error) {
    if (imageRequest.aborted) {
      return;
    }

    console.warn(`An error ocurred when trying to load "${imageRequest.imageId}"`, error);

    this._moveImageIdToFailedSet(imageRequest);
    this._onImageLoadComplete(imageRequest);
  }

  private async _sendNextRequests() {
    // If the service has stopped with async requests in progress this method may
    // get called again when each of those requests are fulfilled.
    if (!this._isRunning) {
      return;
    }

    const { _pendingRequests: pendingRequests, _inflightRequests: inflightRequests } = this;
    const { maxNumPrefetchRequests } = this.config;

    if (!pendingRequests.length || inflightRequests.size >= maxNumPrefetchRequests) {
      return;
    }

    const numImageRequests = Math.min(
      pendingRequests.length,
      maxNumPrefetchRequests - inflightRequests.size
    );
    const imageRequests = this._pendingRequests.splice(0, numImageRequests);

    imageRequests.forEach(imageRequest => {
      const { imageId } = imageRequest;
      const options = {
        priority: -5,
        requestType: IMAGE_REQUEST_TYPE,
        additionalDetails: { imageId },
        preScale: {
          enabled: true,
        },
      };

      imageLoadPoolManager.addRequest(
        async () =>
          imageLoader.loadAndCacheImage(imageId, options).then(
            image => this._onImageLoadSuccess(imageRequest, image),
            error => this._onImageLoadError(imageRequest, error)
          ),
        Enums.RequestType.Prefetch,
        { imageId }
      );

      inflightRequests.set(imageId, imageRequest);
    });
  }

  private _enqueueDisplaySetImagesRequests(displaySet: DisplaySet) {
    const { displaySetInstanceUID } = displaySet;
    const dataSource = this._extensionManager.getActiveDataSource()[0];
    const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
    const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);

    // Check if the displaySet is already being prefetched
    if (displaySetLoadingState) {
      return;
    }

    this._displaySetLoadingStates.set(displaySetInstanceUID, {
      displaySetInstanceUID,
      numImages: imageIds.length,
      pendingImageIds: new Set(imageIds),
      loadedImageIds: new Set(),
      failedImageIds: new Set(),
    });

    imageIds.forEach(imageId => {
      if (cache.getImageLoadObject(imageId)) {
        this._moveImageIdToLoadedSet({ displaySetInstanceUID, imageId });
        return;
      }

      this._pendingRequests.push({
        displaySetInstanceUID,
        imageId,
        aborted: false,
      });
    });
  }

  /**
   * Start prefetching the display sets based on the active viewport and app configuration.
   */
  private _startPrefetching(): void {
    if (this._isRunning) {
      return;
    }

    if (!this.config.enabled) {
      console.log('StudyPrefetcher is not enabled');
      return;
    }

    this._isRunning = true;
    const sortedDisplaySets = this._getSortedDisplaySetsToPrefetch();

    sortedDisplaySets.forEach(displaySets => this._enqueueDisplaySetImagesRequests(displaySets));

    this._sendNextRequests();
    this._broadcastEvent(this.EVENTS.SERVICE_STARTED, {});
  }

  /**
   * Stop prefetching the display sets.
   * All internal variables are cleared but activeDisplaySetsInstanceUIDs otherwise restart would not work.
   */
  private _stopPrefetching(): void {
    if (!this._isRunning) {
      return;
    }
    this._isRunning = false;

    // Mark all inflight requests as aborted before clearing the map.
    this._inflightRequests.forEach(inflightRequest => (inflightRequest.aborted = true));

    this._pendingRequests = [];
    this._displaySetLoadingStates.clear();
    this._inflightRequests.clear();
    imageLoadPoolManager.clearRequestStack(IMAGE_REQUEST_TYPE);

    this._broadcastEvent(this.EVENTS.SERVICE_STOPPED, {});
  }

  /**
   * Restart prefetching in case it is already running.
   */
  private _restartPrefetching(): void {
    if (this._isRunning) {
      this._stopPrefetching();
      this._startPrefetching();
    }
  }
}

export { StudyPrefetcherService as default, StudyPrefetcherService };
