import { PubSubService } from '../_shared/pubSubServiceInterface';

type PresentationIdProvider = (
  id: string,
  { viewport, viewports, isUpdatingSameViewport }
) => unknown;

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

  constructor({ servicesManager }) {
    super(ViewportGridService.EVENTS);
    this.servicesManager = servicesManager;
    this.serviceImplementation = {};
    this.presentationIdProviders = new Map();
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
    this.serviceImplementation._setActiveViewport(id);

    // Use queueMicrotask to delay the event broadcast
    setTimeout(() => {
      this._broadcastEvent(this.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED, {
        viewportId: id,
      });
    }, 0);
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

  public setDisplaySetsForViewport(props) {
    // Just update a single viewport, but use the multi-viewport update for it.
    this.setDisplaySetsForViewports([props]);
  }

  public async setDisplaySetsForViewports(viewportsToUpdate) {
    await this.serviceImplementation._setDisplaySetsForViewports(viewportsToUpdate);
    const state = this.getState();
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

    setTimeout(() => {
      this._broadcastEvent(ViewportGridService.EVENTS.GRID_STATE_CHANGED, {
        state,
        viewports: updatedViewports,
        removedViewportIds,
      });
    });
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

    await this.serviceImplementation._setLayout({
      numCols,
      numRows,
      layoutOptions,
      layoutType,
      activeViewportId,
      findOrCreateViewport,
      isHangingProtocolLayout,
    });

    // Use queueMicrotask to ensure the layout changed event is published after
    setTimeout(() => {
      // Get the new state after the layout change
      const state = this.getState();
      const currentViewportIds = new Set(state.viewports.keys());

      // Determine which viewport IDs have been removed
      const removedViewportIds = [...prevViewportIds].filter(id => !currentViewportIds.has(id));

      this._broadcastEvent(this.EVENTS.LAYOUT_CHANGED, {
        numCols,
        numRows,
      });

      this._broadcastEvent(this.EVENTS.GRID_STATE_CHANGED, {
        state,
        removedViewportIds,
      });
    }, 0);
  }

  public reset() {
    this.serviceImplementation._reset();
  }

  /**
   * The onModeExit must set the state of the viewport grid to a standard/clean
   * state.  To implement store/recover of the viewport grid, perform
   * a state store in the mode or extension onModeExit, and recover that
   * data if appropriate in the onModeEnter of the mode or extension.
   */
  public onModeExit(): void {
    this.serviceImplementation._onModeExit();
  }

  public set(newState) {
    const prevState = this.getState();
    const prevViewportIds = new Set(prevState.viewports.keys());

    this.serviceImplementation._set(newState);

    const state = this.getState();
    const currentViewportIds = new Set(state.viewports.keys());

    const removedViewportIds = [...prevViewportIds].filter(id => !currentViewportIds.has(id));

    setTimeout(() => {
      this._broadcastEvent(this.EVENTS.GRID_STATE_CHANGED, {
        state,
        removedViewportIds,
      });
    }, 0);
  }

  public getNumViewportPanes() {
    return this.serviceImplementation._getNumViewportPanes();
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
