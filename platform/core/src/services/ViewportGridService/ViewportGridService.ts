import { PubSubService } from '../_shared/pubSubServiceInterface';

type PresentationIdProvider = (
  id: string,
  { viewport, viewports, isUpdatingSameViewport }
) => unknown;

type PendingGridStateChangePayload = {
  state: AppTypes.ViewportGrid.State;
  viewports?: AppTypes.ViewportGrid.Viewport[];
  removedViewportIds: string[];
};

type PendingGridStateChange = {
  payload: PendingGridStateChangePayload;
  pendingViewportIds: Set<string>;
};

class ViewportGridService extends PubSubService {
  public static readonly EVENTS = {
    ACTIVE_VIEWPORT_ID_CHANGED: 'event::activeviewportidchanged',
    LAYOUT_CHANGED: 'event::layoutChanged',
    GRID_STATE_CHANGED: 'event::gridStateChanged',
    GRID_SIZE_CHANGED: 'event::gridSizeChanged',
    VIEWPORTS_READY: 'event::viewportsReady',
    VIEWPORT_ONDROP_HANDLED: 'event::viewportOnDropHandled',
  };

  public static REGISTRATION = {
    name: 'viewportGridService',
    altName: 'ViewportGridService',
    create: ({ configuration = {}, servicesManager }) => {
      return new ViewportGridService({ servicesManager });
    },
  };

  serviceImplementation = {};
  servicesManager: AppTypes.ServicesManager;
  presentationIdProviders: Map<string, PresentationIdProvider>;
  pendingGridStateChanges: PendingGridStateChange[];

  constructor({ servicesManager }) {
    super(ViewportGridService.EVENTS);
    this.servicesManager = servicesManager;
    this.serviceImplementation = {};
    this.presentationIdProviders = new Map();
    /**
     * Pending grid state changes waiting for associated viewports
     * to signal that their data updates completed.
     */
    this.pendingGridStateChanges = [];
  }

  public addPresentationIdProvider(id: string, provider: PresentationIdProvider): void {
    this.presentationIdProviders.set(id, provider);
  }

  /**
   * Gets the presentation provider with the given id.
   */
  public getPresentationIdProvider(id: string): PresentationIdProvider {
    return this.presentationIdProviders.get(id);
  }

  public getPresentationId(id: string, viewportId: string): string | null {
    const state = this.getState();
    const viewport = state.viewports.get(viewportId);
    return this._getPresentationId(id, {
      viewport,
      viewports: state.viewports,
    });
  }

  private _getPresentationId(id, { viewport, viewports }) {
    const isUpdatingSameViewport = [...viewports.values()].some(
      v =>
        v.displaySetInstanceUIDs?.toString() === viewport.displaySetInstanceUIDs?.toString() &&
        v.viewportId === viewport.viewportId
    );

    const provider = this.presentationIdProviders.get(id);
    if (provider) {
      const result = provider(id, {
        viewport,
        viewports,
        isUpdatingSameViewport,
        servicesManager: this.servicesManager,
      });
      return result;
    }
    return null;
  }

  public getPresentationIds({ viewport, viewports }) {
    // Use the keys of the Map to get all registered provider IDs
    const registeredPresentationProviders = Array.from(this.presentationIdProviders.keys());

    return registeredPresentationProviders.reduce((acc, id) => {
      const value = this._getPresentationId(id, {
        viewport,
        viewports,
      });
      if (value !== null) {
        acc[id] = value;
      }
      return acc;
    }, {});
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    setActiveViewportId: setActiveViewportIdImplementation,
    setDisplaySetsForViewports: setDisplaySetsForViewportsImplementation,
    setLayout: setLayoutImplementation,
    reset: resetImplementation,
    onModeExit: onModeExitImplementation,
    set: setImplementation,
    getNumViewportPanes: getNumViewportPanesImplementation,
    setViewportIsReady: setViewportIsReadyImplementation,
    getViewportState: getViewportStateImplementation,
  }): void {
    if (getViewportStateImplementation) {
      this.serviceImplementation._getViewportState = getViewportStateImplementation;
    }
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setActiveViewportIdImplementation) {
      this.serviceImplementation._setActiveViewport = setActiveViewportIdImplementation;
    }
    if (setDisplaySetsForViewportsImplementation) {
      this.serviceImplementation._setDisplaySetsForViewports =
        setDisplaySetsForViewportsImplementation;
    }
    if (setLayoutImplementation) {
      this.serviceImplementation._setLayout = setLayoutImplementation;
    }
    if (resetImplementation) {
      this.serviceImplementation._reset = resetImplementation;
    }
    if (onModeExitImplementation) {
      this.serviceImplementation._onModeExit = onModeExitImplementation;
    }
    if (setImplementation) {
      this.serviceImplementation._set = setImplementation;
    }
    if (getNumViewportPanesImplementation) {
      this.serviceImplementation._getNumViewportPanes = getNumViewportPanesImplementation;
    }

    if (setViewportIsReadyImplementation) {
      this.serviceImplementation._setViewportIsReady = setViewportIsReadyImplementation;
    }
  }

  public publishViewportsReady() {
    this._broadcastEvent(this.EVENTS.VIEWPORTS_READY, {});
  }

  public publishViewportOnDropHandled(eventData) {
    this._broadcastEvent(this.EVENTS.VIEWPORT_ONDROP_HANDLED, { eventData });
  }

  public setActiveViewportId(id: string) {
    if (id === this.getActiveViewportId()) {
      return;
    }
    const state = this.serviceImplementation._setActiveViewport(id);

    // Use queueMicrotask to delay the event broadcast
    this._broadcastEvent(this.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED, {
      viewportId: id,
      state,
    });

    return state;
  }

  public getState(): AppTypes.ViewportGrid.State {
    return this.serviceImplementation._getState();
  }

  public getViewportState(viewportId: string) {
    return this.serviceImplementation._getViewportState(viewportId);
  }

  public setViewportIsReady(viewportId, callback) {
    this.serviceImplementation._setViewportIsReady(viewportId, callback);
  }

  public getActiveViewportId() {
    const state = this.getState();
    return state.activeViewportId;
  }

  public setViewportGridSizeChanged() {
    const state = this.getState();
    this._broadcastEvent(this.EVENTS.GRID_SIZE_CHANGED, {
      state,
    });
  }

  public setDisplaySetsForViewport(props, options: { preCallback?: () => void } = {}) {
    // Just update a single viewport, but use the multi-viewport update for it.
    this.setDisplaySetsForViewports([props], { preCallback: options.preCallback });
  }

  public async setDisplaySetsForViewports(
    viewportsToUpdate,
    { preCallback }: { preCallback?: () => void } = {}
  ) {
    if (preCallback) {
      preCallback();
    }

    const state = await this.serviceImplementation._setDisplaySetsForViewports(viewportsToUpdate);
    const updatedViewports = [];

    const removedViewportIds = [];

    for (const viewport of viewportsToUpdate) {
      const updatedViewport = state.viewports.get(viewport.viewportId);

      if (updatedViewport) {
        updatedViewports.push(updatedViewport);

        const updatedDisplaySetUIDs = updatedViewport.displaySetInstanceUIDs || [];

        const isCleared = updatedDisplaySetUIDs.length === 0;

        if (isCleared) {
          removedViewportIds.push(viewport.viewportId);
        }
      } else {
        removedViewportIds.push(viewport.viewportId);
      }
    }

    this._queueGridStateChanged(
      {
        state,
        viewports: updatedViewports,
        removedViewportIds,
      },
      updatedViewports.map(viewport => viewport.viewportId)
    );
  }

  /**
   * Retrieves the display set instance UIDs for a given viewport.
   * @param viewportId The ID of the viewport.
   * @returns An array of display set instance UIDs.
   */
  public getDisplaySetsUIDsForViewport(viewportId: string) {
    const state = this.getState();
    const viewport = state.viewports.get(viewportId);
    return viewport?.displaySetInstanceUIDs;
  }

  /**
   *
   * @param numCols, numRows - the number of columns and rows to apply
   * @param findOrCreateViewport is a function which takes the
   *    index position of the viewport, the position id, and a set of
   *    options that is initially provided as {} (eg to store intermediate state)
   *    The function returns a viewport object to use at the given position.
   */
  public async setLayout({
    numCols,
    numRows,
    layoutOptions,
    layoutType = 'grid',
    activeViewportId = undefined,
    findOrCreateViewport = undefined,
    isHangingProtocolLayout = false,
  }) {
    // Get the previous state before the layout change
    const prevState = this.getState();
    const prevViewportIds = new Set(prevState.viewports.keys());

    const state = await this.serviceImplementation._setLayout({
      numCols,
      numRows,
      layoutOptions,
      layoutType,
      activeViewportId,
      findOrCreateViewport,
      isHangingProtocolLayout,
    });

    const currentViewportIds = new Set(state.viewports.keys());

    // Determine which viewport IDs have been removed
    const removedViewportIds = [...prevViewportIds].filter(id => !currentViewportIds.has(id));

    // Use queueMicrotask to ensure the layout changed event is published after
    this._broadcastEvent(this.EVENTS.LAYOUT_CHANGED, {
      numCols,
      numRows,
    });

    this._queueGridStateChanged(
      {
        state,
        removedViewportIds,
      },
      Array.from(state.viewports.keys())
    );
  }

  public reset() {
    this.serviceImplementation._reset();
    this.pendingGridStateChanges = [];
  }

  /**
   * The onModeExit must set the state of the viewport grid to a standard/clean
   * state.  To implement store/recover of the viewport grid, perform
   * a state store in the mode or extension onModeExit, and recover that
   * data if appropriate in the onModeEnter of the mode or extension.
   */
  public onModeExit(): void {
    this.serviceImplementation._onModeExit();
    this.pendingGridStateChanges = [];
  }

  public set(newState) {
    const prevState = this.getState();
    const prevViewportIds = new Set(prevState.viewports.keys());

    const state = this.serviceImplementation._set(newState);

    const currentViewportIds = new Set(state.viewports.keys());

    const removedViewportIds = [...prevViewportIds].filter(id => !currentViewportIds.has(id));

    this._queueGridStateChanged(
      {
        state,
        removedViewportIds,
      },
      Array.from(state.viewports.keys())
    );
  }

  public getNumViewportPanes() {
    return this.serviceImplementation._getNumViewportPanes();
  }

  /**
   * Signals that a viewport has finished applying its pending data update so that queued
   * grid state changes can be published when all dependencies are resolved.
   */
  public notifyViewportUpdateCompleted(viewportId: string) {
    if (!viewportId || !this.pendingGridStateChanges.length) {
      return;
    }

    for (let i = 0; i < this.pendingGridStateChanges.length; i++) {
      const pendingChange = this.pendingGridStateChanges[i];
      if (pendingChange.pendingViewportIds.delete(viewportId)) {
        break;
      }
    }

    this._flushPendingGridStateChanges();
  }

  private _queueGridStateChanged(
    payload: PendingGridStateChangePayload,
    pendingViewportIds: string[] = []
  ) {
    const uniquePendingIds = Array.from(new Set(pendingViewportIds?.filter(Boolean)));

    if (!uniquePendingIds.length) {
      this._broadcastEvent(this.EVENTS.GRID_STATE_CHANGED, payload);
      return;
    }

    const pendingChange: PendingGridStateChange = {
      payload,
      pendingViewportIds: new Set(uniquePendingIds),
    };

    this.pendingGridStateChanges.push(pendingChange);
  }

  private _flushPendingGridStateChanges() {
    while (this.pendingGridStateChanges.length) {
      const nextChange = this.pendingGridStateChanges[0];
      if (nextChange.pendingViewportIds.size) {
        break;
      }

      this._broadcastEvent(this.EVENTS.GRID_STATE_CHANGED, nextChange.payload);
      this.pendingGridStateChanges.shift();
    }
  }

  public getLayoutOptionsFromState(
    state: any
  ): { x: number; y: number; width: number; height: number }[] {
    return Array.from(state.viewports.entries()).map(([_, viewport]) => {
      return {
        x: viewport.x,
        y: viewport.y,
        width: viewport.width,
        height: viewport.height,
      };
    });
  }
}

export default ViewportGridService;
