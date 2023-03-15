import { PubSubService } from '../_shared/pubSubServiceInterface';

const EVENTS = {
  ACTIVE_VIEWPORT_INDEX_CHANGED: 'event::activeviewportindexchanged',
};

class ViewportGridService extends PubSubService {
  public static REGISTRATION = {
    name: 'viewportGridService',
    altName: 'ViewportGridService',
    create: ({ configuration = {} }) => {
      return new ViewportGridService();
    },
  };
  public static EVENTS = EVENTS;

  serviceImplementation = {};

  constructor() {
    super(EVENTS);
    this.serviceImplementation = {};
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    setActiveViewportIndex: setActiveViewportIndexImplementation,
    setDisplaySetsForViewport: setDisplaySetsForViewportImplementation,
    setDisplaySetsForViewports: setDisplaySetsForViewportsImplementation,
    setLayout: setLayoutImplementation,
    reset: resetImplementation,
    onModeExit: onModeExitImplementation,
    set: setImplementation,
    getNumViewportPanes: getNumViewportPanesImplementation,
  }): void {
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
    if (onModeExitImplementation) {
      this.serviceImplementation._onModeExit = onModeExitImplementation;
    }
    if (setImplementation) {
      this.serviceImplementation._set = setImplementation;
    }
    if (getNumViewportPanesImplementation) {
      this.serviceImplementation._getNumViewportPanes = getNumViewportPanesImplementation;
    }
  }

  public setActiveViewportIndex(index) {
    this.serviceImplementation._setActiveViewportIndex(index);
    const state = this.getState();
    const viewportId = state.viewports[index]?.viewportOptions?.viewportId;
    this._broadcastEvent(this.EVENTS.ACTIVE_VIEWPORT_INDEX_CHANGED, {
      viewportIndex: index,
      viewportId,
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

  /**
   *
   * @param numCols, numRows - the number of columns and rows to apply
   * @param findOrCreateViewport is a function which takes the
   *    index position of the viewport, the position id, and a set of
   *    options that is initially provided as {} (eg to store intermediate state)
   *    The function returns a viewport object to use at the given position.
   */
  public setLayout({ numCols, numRows, findOrCreateViewport = undefined }) {
    this.serviceImplementation._setLayout({
      numCols,
      numRows,
      findOrCreateViewport,
    });
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

  public set(state) {
    this.serviceImplementation._set(state);
  }

  public getNumViewportPanes() {
    return this.serviceImplementation._getNumViewportPanes();
  }
}

export default ViewportGridService;
