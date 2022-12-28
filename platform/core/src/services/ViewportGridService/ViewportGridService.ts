import pubSubServiceInterface from './../_shared/pubSubServiceInterface';

const EVENTS = {
  ACTIVE_VIEWPORT_INDEX_CHANGED: 'event::activeviewportindexchanged',
};

class ViewportGridService {
  serviceImplementation = {};
  EVENTS: { [key: string]: string };
  listeners = {};

  constructor() {
    Object.assign(this, pubSubServiceInterface);
    this.serviceImplementation = {};
    this.EVENTS = EVENTS;
  }

  setServiceImplementation({
    getState: getStateImplementation,
    setActiveViewportIndex: setActiveViewportIndexImplementation,
    setDisplaySetsForViewport: setDisplaySetsForViewportImplementation,
    setDisplaySetsForViewports: setDisplaySetsForViewportsImplementation,
    setCachedLayout: setCachedLayoutImplementation,
    restoreCachedLayout: restoreCachedLayoutImplementation,
    setLayout: setLayoutImplementation,
    reset: resetImplementation,
    onModeExit: onModeExitImplementation,
    set: setImplementation,
  }) {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setActiveViewportIndexImplementation) {
      this.serviceImplementation._setActiveViewportIndex = setActiveViewportIndexImplementation;
    }
    if (setDisplaySetsForViewportImplementation) {
      this.serviceImplementation._setDisplaySetsForViewport = setDisplaySetsForViewportImplementation;
    }
    if (setDisplaySetsForViewportsImplementation) {
      this.serviceImplementation._setDisplaySetsForViewports = setDisplaySetsForViewportsImplementation;
    }
    if (setLayoutImplementation) {
      this.serviceImplementation._setLayout = setLayoutImplementation;
    }
    if (resetImplementation) {
      this.serviceImplementation._reset = resetImplementation;
    }
    if (setCachedLayoutImplementation) {
      this.serviceImplementation._setCachedLayout = setCachedLayoutImplementation;
    }
    if (restoreCachedLayoutImplementation) {
      this.serviceImplementation._restoreCachedLayout = restoreCachedLayoutImplementation;
    }
    if (onModeExitImplementation) {
      this.serviceImplementation._onModeExit = onModeExitImplementation;
    }
    if (setImplementation) {
      this.serviceImplementation._set = setImplementation;
    }
  }

  public setActiveViewportIndex(index) {
    this.serviceImplementation._setActiveViewportIndex(index);
    this._broadcastEvent(this.EVENTS.ACTIVE_VIEWPORT_INDEX_CHANGED, {
      viewportIndex: index,
    });
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setDisplaySetsForViewport({
    viewportIndex,
    displaySetInstanceUIDs,
    viewportOptions,
    displaySetOptions,
  }) {
    this.serviceImplementation._setDisplaySetsForViewport({
      viewportIndex,
      displaySetInstanceUIDs,
      viewportOptions,
      displaySetOptions,
    });
  }

  public setDisplaySetsForViewports(viewports) {
    this.serviceImplementation._setDisplaySetsForViewports(viewports);
  }

  public setLayout({ numCols, numRows }) {
    this.serviceImplementation._setLayout({ numCols, numRows });
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

  public setCachedLayout({ cacheId, cachedLayout }) {
    this.serviceImplementation._setCachedLayout({ cacheId, cachedLayout });
  }

  public restoreCachedLayout(cacheId) {
    this.serviceImplementation._restoreCachedLayout(cacheId);
  }

  public set(state) {
    this.serviceImplementation._set(state);
  }
}

export default {
  name: 'ViewportGridService',
  create: ({ configuration = {} }) => {
    return new ViewportGridService();
  },
};
