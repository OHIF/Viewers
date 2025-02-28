import { PubSubService } from '../_shared/pubSubServiceInterface';
import { ExtensionManager } from '../../extensions';
import ServicesManager from '../ServicesManager';
import ViewportGridService from '../ViewportGridService';
import { DisplaySet } from '../../types';

enum RequestType {
  /** Highest priority for loading*/
  Interaction = 'interaction',
  /** Second highest priority for loading*/
  Thumbnail = 'thumbnail',
  /** Third highest priority for loading, usually used for image loading in the background*/
  Prefetch = 'prefetch',
  /** Lower priority, often used for background computations in the worker */
  Compute = 'compute',
}

export const EVENTS = {
  SERVICE_STARTED: 'event::studyPrefetcherService:started',
  SERVICE_STOPPED: 'event::studyPrefetcherService:stopped',
  DISPLAYSET_LOAD_PROGRESS: 'event::studyPrefetcherService:displaySetLoadProgress',
  DISPLAYSET_LOAD_COMPLETE: 'event::studyPrefetcherService:displaySetLoadComplete',
};

/**
 * Order used for prefetching display set
 */
enum StudyPrefetchOrder {
  closest = 'closest',
  downward = 'downward',
  upward = 'upward',
}

/**
 * Study Prefetcher configuration
 */
type StudyPrefetcherConfig = {
  /* Enable/disable study prefetching service */
  enabled: boolean;
  /* Number of displaysets to be prefetched */
  displaySetsCount: number;
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
  maxNumPrefetchRequests: number;
  /* Display sets prefetching order (closest, downward and upward) */
  order: StudyPrefetchOrder;
};

type DisplaySetLoadingState = {
  displaySetInstanceUID: string;
  numInstances: number;
  pendingImageIds: Set<string>;
  loadedImageIds: Set<string>;
  failedImageIds: Set<string>;
  loadingProgress: number;
};

type ImageRequest = {
  displaySetInstanceUID: string;
  imageId: string;
  aborted: boolean;
};

type PubSubServiceSubscription = { unsubscribe: () => any };

interface ICache {
  isImageCached(imageId: string): boolean;
}

interface IImageLoadPoolManager {
  addRequest(
    requestFn: () => Promise<any>,
    type: string,
    additionalDetails: Record<string, unknown>,
    priority?: number
  );
  clearRequestStack(type: string): void;
}

interface IImageLoader {
  loadAndCacheImage(imageId: string, options: any): Promise<any>;
}

type EventSubscription = {
  unsubscribe: () => void;
};

interface IImageLoadEventsManager {
  addEventListeners(
    onImageLoaded: (evt: any) => void,
    onImageLoadFailed: (evt: any) => void
  ): EventSubscription[];
}

class StudyPrefetcherService extends PubSubService {
  private _extensionManager: ExtensionManager;
  private _servicesManager: ServicesManager;
  private _subscriptions: PubSubServiceSubscription[];
  private _activeDisplaySetsInstanceUIDs: string[] = [];
  private _pendingRequests: ImageRequest[] = [];
  private _inflightRequests = new Map<string, ImageRequest>();
  private _isRunning = false;
  private _displaySetLoadingStates = new Map<string, DisplaySetLoadingState>();
  private _imageIdsToDisplaySetsMap = new Map<string, Set<string>>();
  private config: StudyPrefetcherConfig = {
    /* Enable/disable study prefetching service */
    enabled: false,
    /* Number of displaysets to be prefetched */
    displaySetsCount: 1,
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
    /* Display sets prefetching order (closest, downward and upward) */
    order: StudyPrefetchOrder.downward,
  };

  // Properties set by Cornerstone extension (initStudyPrefetcherService)
  public requestType: string = RequestType.Prefetch;
  public cache: ICache;
  public imageLoadPoolManager: IImageLoadPoolManager;
  public imageLoader: IImageLoader;
  public imageLoadEventsManager: IImageLoadEventsManager;

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
    configuration: StudyPrefetcherConfig;
  }) {
    super(EVENTS);

    this._servicesManager = servicesManager;
    this._extensionManager = extensionManager;
    this._subscriptions = [];

    Object.assign(this.config, configuration);
  }

  public onModeEnter(): void {
    this._addEventListeners();
  }

  /**
   * The onModeExit returns the service to the initial state.
   */
  public onModeExit(): void {
    this._removeEventListeners();
    this._stopPrefetching();
  }

  private _addImageLoadingEventsListeners() {
    const fnOnImageLoadCompleted = (imageId: string) => {
      // `sendNextRequests` must be called after image loaded/failed events
      // to make sure prefetch requests shall be sent as soon as the active
      // displaySets (active viewport) are loaded.
      //
      // PS: active display sets are not loaded by this service and that is why
      // the requests shall not be in the inflight queue.
      if (!this._inflightRequests.get(imageId)) {
        this._sendNextRequests();
      }
    };

    const fnImageLoadedEventListener = evt => {
      const { image } = evt.detail;
      const { imageId } = image;

      this._moveImageIdToLoadedSet(imageId);
      fnOnImageLoadCompleted(imageId);
    };

    const fnImageLoadFailedEventListener = evt => {
      const { imageId } = evt.detail;

      this._moveImageIdToFailedSet(imageId);
      fnOnImageLoadCompleted(imageId);
    };

    return this.imageLoadEventsManager.addEventListeners(
      fnImageLoadedEventListener,
      fnImageLoadFailedEventListener
    );
  }

  private _addServicesListeners() {
    const { displaySetService, viewportGridService } = this._servicesManager.services;

    // Restart the prefetcher after any change to the displaySets
    // (eg: sorting the displaySets on StudyBrowser)
    const displaySetsChangedSubscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      () => this._syncWithActiveViewport({ forceRestart: true })
    );

    // Loads new datasets when making a new viewport active
    const viewportGridActiveViewportIdSubscription = viewportGridService.subscribe(
      ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      ({ viewportId }) => this._syncWithActiveViewport({ activeViewportId: viewportId })
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

    return [
      displaySetsChangedSubscription,
      viewportGridActiveViewportIdSubscription,
      viewportGridLayoutChangedSubscription,
      viewportGridStateChangedSubscription,
      viewportGridViewportreadySubscription,
    ];
  }

  private _addEventListeners() {
    const imageLoadingEventsSubscriptions = this._addImageLoadingEventsListeners();
    const servicesSubscriptions = this._addServicesListeners();

    this._subscriptions.push(...imageLoadingEventsSubscriptions);
    this._subscriptions.push(...servicesSubscriptions);
  }

  private _removeEventListeners() {
    this._subscriptions.forEach(subscription => subscription.unsubscribe());
    this._subscriptions = [];
  }

  private _syncWithActiveViewport({
    activeViewportId,
    forceRestart,
  }: {
    activeViewportId?: string;
    forceRestart?: boolean;
  } = {}) {
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

    if (forceRestart || displaySetUpdated) {
      this._restartPrefetching();
    }
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

  private _areActiveDisplaySetsLoaded() {
    const { _activeDisplaySetsInstanceUIDs: displaySetsInstanceUIDs } = this;

    return (
      displaySetsInstanceUIDs.length &&
      displaySetsInstanceUIDs.every(
        displaySetsInstanceUID =>
          this._displaySetLoadingStates.get(displaySetsInstanceUID).loadingProgress >= 1
      )
    );
  }

  private _getClosestDisplaySets(displaySets: DisplaySet[], activeDisplaySetIndex: number) {
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

  private _getDownwardDisplaySets(displaySets: DisplaySet[], activeDisplaySetIndex: number) {
    const sortedDisplaySets = [];

    for (let i = activeDisplaySetIndex + 1; i < displaySets.length; i++) {
      sortedDisplaySets.push(displaySets[i]);
    }

    return sortedDisplaySets;
  }

  private _getUpwardDisplaySets(displaySets: DisplaySet[], activeDisplaySetIndex: number) {
    const sortedDisplaySets = [];

    for (let i = activeDisplaySetIndex - 1; i >= 0 && i !== activeDisplaySetIndex; i--) {
      sortedDisplaySets.push(displaySets[i]);
    }

    return sortedDisplaySets;
  }

  private _getSortedDisplaySetsToPrefetch(displaySets: DisplaySet[]): DisplaySet[] {
    if (!this._activeDisplaySetsInstanceUIDs?.length) {
      return [];
    }

    const { displaySetsCount } = this.config;
    const activeDisplaySetsInstanceUIDs = this._activeDisplaySetsInstanceUIDs;
    const [activeDisplaySetUID] = activeDisplaySetsInstanceUIDs;
    const activeDisplaySetIndex = displaySets.findIndex(
      ds => ds.displaySetInstanceUID === activeDisplaySetUID
    );
    const getDisplaySetsFunctionsMap = {
      [StudyPrefetchOrder.closest]: this._getClosestDisplaySets,
      [StudyPrefetchOrder.downward]: this._getDownwardDisplaySets,
      [StudyPrefetchOrder.upward]: this._getUpwardDisplaySets,
    };
    const { order } = this.config;
    const fnGetDisplaySets = getDisplaySetsFunctionsMap[order];

    if (!fnGetDisplaySets) {
      throw new Error(`Invalid order (${order})`);
    }

    // Creates a `Set` to look for UIDs in O(1) instead of O(n)
    const uidsSet = new Set(activeDisplaySetsInstanceUIDs);

    // Remove any active displaySet that may still be in the activeDisplaySetsInstanceUIDs.
    // That may happen when activeDisplaySetsInstanceUIDs has more than one element.
    return fnGetDisplaySets
      .call(this, displaySets, activeDisplaySetIndex)
      .filter(ds => !uidsSet.has(ds.displaySetInstanceUID))
      .slice(0, displaySetsCount);
  }

  private _getDisplaySets() {
    const { displaySetService } = this._servicesManager.services;
    const displaySets = [...displaySetService.getActiveDisplaySets()];
    const displaySetsToPrefetch = this._getSortedDisplaySetsToPrefetch(displaySets);

    return { displaySets, displaySetsToPrefetch };
  }

  private _updateImageIdsDisplaySetMap(displaySetInstanceUID: string, imageIds: string[]): void {
    for (const imageId of imageIds) {
      let displaySetsInstanceUIDsMap = this._imageIdsToDisplaySetsMap.get(imageId);

      if (!displaySetsInstanceUIDsMap) {
        displaySetsInstanceUIDsMap = new Set();
        this._imageIdsToDisplaySetsMap.set(imageId, displaySetsInstanceUIDsMap);
      }

      displaySetsInstanceUIDsMap.add(displaySetInstanceUID);
    }
  }

  private _getImageIdsForDisplaySet(displaySet: DisplaySet): string[] {
    const dataSource = this._extensionManager.getActiveDataSource()[0];

    return dataSource.getImageIdsForDisplaySet(displaySet);
  }

  private _updateDisplaySetLoadingProgress(displaySetLoadingState: DisplaySetLoadingState) {
    const { numInstances, loadedImageIds, failedImageIds } = displaySetLoadingState;
    const loadingProgress = (loadedImageIds.size + failedImageIds.size) / numInstances;

    displaySetLoadingState.loadingProgress = loadingProgress;
  }

  private _addDisplaySetLoadingState(displaySet: DisplaySet): void {
    const { displaySetInstanceUID } = displaySet;
    const imageIds = this._getImageIdsForDisplaySet(displaySet);
    let displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);

    if (displaySetLoadingState) {
      return;
    }

    const pendingImageIds = new Set<string>(imageIds);
    const loadedImageIds = new Set<string>();

    // Needs to check which image is already loaded to update the progress properly
    // because some images may already be loaded (thumbnails and viewports).
    for (const imageId of imageIds) {
      if (this.cache.isImageCached(imageId)) {
        loadedImageIds.add(imageId);
      } else {
        pendingImageIds.add(imageId);
      }
    }

    displaySetLoadingState = {
      displaySetInstanceUID,
      numInstances: imageIds.length,
      pendingImageIds,
      loadedImageIds,
      failedImageIds: new Set(),
      loadingProgress: 0,
    };

    this._updateDisplaySetLoadingProgress(displaySetLoadingState);
    this._displaySetLoadingStates.set(displaySetInstanceUID, displaySetLoadingState);
    this._updateImageIdsDisplaySetMap(displaySetInstanceUID, imageIds);

    // Notify the UI that something is already loaded (eg: update StudyBrowser)
    if (loadedImageIds.size) {
      this._triggerDisplaySetEvents(displaySetInstanceUID);
    }
  }

  private _loadDisplaySets() {
    const { displaySets, displaySetsToPrefetch } = this._getDisplaySets();

    displaySets.forEach(displaySet => this._addDisplaySetLoadingState(displaySet));
    displaySetsToPrefetch.forEach(displaySet => this._enqueueDisplaySetImagesRequests(displaySet));
  }

  private _moveImageIdToLoadedSet(imageId: string): boolean {
    const displaySetsInstanceUIDs = this._imageIdsToDisplaySetsMap.get(imageId);

    if (!displaySetsInstanceUIDs) {
      return;
    }

    for (const displaySetInstanceUID of Array.from(displaySetsInstanceUIDs.values())) {
      const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);
      const { pendingImageIds, loadedImageIds } = displaySetLoadingState;

      pendingImageIds.delete(imageId);
      loadedImageIds.add(imageId);

      this._updateDisplaySetLoadingProgress(displaySetLoadingState);
      this._triggerDisplaySetEvents(displaySetInstanceUID);
    }

    return true;
  }

  private _moveImageIdToFailedSet(imageId: string): boolean {
    const displaySetsInstanceUIDs = this._imageIdsToDisplaySetsMap.get(imageId);

    if (!displaySetsInstanceUIDs) {
      return;
    }

    for (const displaySetInstanceUID of Array.from(displaySetsInstanceUIDs.values())) {
      const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);
      const { pendingImageIds, failedImageIds } = displaySetLoadingState;

      pendingImageIds.delete(imageId);
      failedImageIds.add(imageId);

      this._updateDisplaySetLoadingProgress(displaySetLoadingState);
      this._triggerDisplaySetEvents(displaySetInstanceUID);
    }

    return true;
  }

  private _triggerDisplaySetEvents(displaySetInstanceUID: string) {
    const displaySetLoadingState = this._displaySetLoadingStates.get(displaySetInstanceUID);
    const { loadingProgress, numInstances } = displaySetLoadingState;

    this._broadcastEvent(this.EVENTS.DISPLAYSET_LOAD_PROGRESS, {
      displaySetInstanceUID,
      numInstances,
      loadingProgress,
    });

    if (loadingProgress >= 1) {
      this._broadcastEvent(this.EVENTS.DISPLAYSET_LOAD_COMPLETE, {
        displaySetInstanceUID,
      });
    }
  }

  private _onImagePrefetchSuccess(imageRequest: ImageRequest) {
    if (imageRequest.aborted) {
      return;
    }

    const { imageId } = imageRequest;

    this._inflightRequests.delete(imageId);
    this._moveImageIdToLoadedSet(imageId);

    // `sendNextRequests` must be called after removing the request from the inflight
    // queue otherwise it shall not be able to send the request (maxNumPrefetchRequests)
    this._sendNextRequests();
  }

  private _onImagePrefetchFailed(imageRequest, error) {
    if (imageRequest.aborted) {
      return;
    }

    console.warn(`An error ocurred when trying to load "${imageRequest.imageId}"`, error);

    const { imageId } = imageRequest;

    this._inflightRequests.delete(imageId);
    this._moveImageIdToFailedSet(imageId);

    // `sendNextRequests` must be called after removing the request from the inflight
    // queue otherwise it shall not be able to send the request (maxNumPrefetchRequests)
    this._sendNextRequests();
  }

  private async _sendNextRequests() {
    // If the service has stopped with async requests in progress this method may
    // get called again when each of those requests are fulfilled.
    if (!this._isRunning) {
      return;
    }

    // Does not send any prefetch request until the active display sets are loaded
    if (!this._areActiveDisplaySetsLoaded()) {
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
        requestType: this.requestType,
        additionalDetails: { imageId },
        preScale: {
          enabled: true,
        },
      };

      this.imageLoadPoolManager.addRequest(
        async () =>
          this.imageLoader.loadAndCacheImage(imageId, options).then(
            _image => this._onImagePrefetchSuccess(imageRequest),
            error => this._onImagePrefetchFailed(imageRequest, error)
          ),
        this.requestType,
        { imageId }
      );

      inflightRequests.set(imageId, imageRequest);
    });
  }

  private _enqueueDisplaySetImagesRequests(displaySet: DisplaySet) {
    const { displaySetInstanceUID } = displaySet;
    const imageIds = this._getImageIdsForDisplaySet(displaySet);

    imageIds.forEach(imageId => {
      if (this.cache.isImageCached(imageId)) {
        this._moveImageIdToLoadedSet(imageId);
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

    this._loadDisplaySets();
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
    this._imageIdsToDisplaySetsMap.clear();
    this._inflightRequests.clear();
    this.imageLoadPoolManager.clearRequestStack(this.requestType);

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
