import { PubSubService } from '../_shared/pubSubServiceInterface';
import { assembleLegacyState, createViewportGridStore } from './gridStore';
import type {
  GetPresentationIds,
  PaneGeometry,
  SetDisplaySetsUpdate,
  ViewportComposition,
  ViewportGridSnapshot,
  ViewportGridStore,
  ViewportGridStoreState,
  ViewportRuntimeEntry,
  ViewportRuntimePhase,
} from './gridStore';

type PresentationIdProvider = (
  id: string,
  { viewport, viewports, isUpdatingSameViewport }
) => unknown;

export interface SelectOptions<T> {
  equality?: (a: T, b: T) => boolean;
  fireImmediately?: boolean;
}

/**
 * ViewportGridService is a facade over the viewport grid store (gridStore.ts).
 * The public method surface, EVENTS and their payloads are unchanged; state
 * reads are always current because they come from the store synchronously,
 * and the pre-existing setTimeout event deferrals are kept for bug-for-bug
 * timing compatibility with the event consumers.
 */
class ViewportGridService extends PubSubService {
  /**
   * These events are the compatibility bridge for pre-store consumers; the
   * primary subscription surface is `select()` on this service (or the
   * `useViewportGrid(selector)` hook) against the grid store state.
   */
  public static readonly EVENTS = {
    ACTIVE_VIEWPORT_ID_CHANGED: 'event::activeviewportidchanged',
    LAYOUT_CHANGED: 'event::layoutChanged',
    GRID_STATE_CHANGED: 'event::gridStateChanged',
    /** Still broadcast for external consumers, but has no in-repo subscribers. */
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

  servicesManager: AppTypes.ServicesManager;
  presentationIdProviders: Map<string, PresentationIdProvider>;

  private _store: ViewportGridStore;
  private _hasWarnedSetServiceImplementation = false;
  private _publishedReadyLayoutRevision = -1;
  private _scheduledReadyLayoutRevision = -1;

  constructor({ servicesManager }) {
    super(ViewportGridService.EVENTS);
    this.servicesManager = servicesManager;
    this.presentationIdProviders = new Map();
    this._store = createViewportGridStore({
      getPresentationIds: (args => this.getPresentationIds(args)) as unknown as GetPresentationIds,
    });
    this._installViewportsReadyBridge();
  }

  /**
   * Bridges derived.allMounted to the VIEWPORTS_READY event (plan section 4.8):
   * one publish per layout.layoutRevision, the first time every content
   * viewport has mounted its current composition. The subscription selects
   * (allMounted, layoutRevision) rather than allMounted edges because a
   * relayout that reuses every viewport carries the runtime forward, so
   * allMounted can already be true inside the applyLayout transaction and
   * never transition for the new revision.
   *
   * Deliberate divergence from the pre-store grid effect, which gated on a
   * numCols-numRows hash: a same-dimensions relayout (eg an HP stage change
   * staying 1x1) bumps layoutRevision and re-publishes here, where the old
   * code stayed silent and left ready-driven consumers un-refreshed.
   */
  private _installViewportsReadyBridge(): void {
    this.select(
      state => ({
        allMounted: state.derived.allMounted,
        layoutRevision: state.layout.layoutRevision,
      }),
      ({ allMounted, layoutRevision }) => {
        if (
          !allMounted ||
          layoutRevision <= this._publishedReadyLayoutRevision ||
          layoutRevision === this._scheduledReadyLayoutRevision
        ) {
          return;
        }
        this._scheduledReadyLayoutRevision = layoutRevision;
        // Deferred broadcast, matching the other grid events. The state is
        // re-validated when the macrotask runs: a relayout applied in between
        // supersedes the captured revision, and its own mount cycle owns the
        // next publish. The publish slot is consumed at broadcast time, not
        // schedule time, so an aborted publish - eg restore() reinstating
        // mounted runtime and a remount invalidating it before the timer -
        // leaves the slot free and the genuine all-mounted transition for the
        // revision still publishes.
        setTimeout(() => {
          if (this._scheduledReadyLayoutRevision === layoutRevision) {
            this._scheduledReadyLayoutRevision = -1;
          }
          const state = this._store.getState();
          if (
            state.layout.layoutRevision !== layoutRevision ||
            !state.derived.allMounted ||
            layoutRevision <= this._publishedReadyLayoutRevision
          ) {
            return;
          }
          this._publishedReadyLayoutRevision = layoutRevision;
          this._broadcastEvent(this.EVENTS.VIEWPORTS_READY, {});
        }, 0);
      },
      { equality: (a, b) => a.allMounted === b.allMounted && a.layoutRevision === b.layoutRevision }
    );
  }

  /**
   * Returns the underlying grid store, for the React binding and other
   * subscribe-with-selector consumers.
   */
  public getStore(): ViewportGridStore {
    return this._store;
  }

  /**
   * Subscribes a listener to a selected slice of the grid store state.
   * The listener fires only when the selected value changes.
   *
   * Listeners run SYNCHRONOUSLY inside the writing store transaction (eg
   * inside setLayout/reportPhase call stacks), so they observe intermediate
   * grid states earlier than the deferred legacy events did; consumers that
   * need the old macrotask timing must defer their own bodies. Listener
   * errors are caught and logged so a consumer throw cannot abort the
   * writing transaction or sibling listeners.
   */
  public select<T>(
    selector: (state: ViewportGridStoreState) => T,
    listener: (selected: T, previousSelected: T) => void,
    options?: SelectOptions<T>
  ): () => void {
    const guardedListener = (selected: T, previousSelected: T) => {
      try {
        listener(selected, previousSelected);
      } catch (error) {
        console.error('ViewportGridService select listener failed', error);
      }
    };
    return this._store.subscribe(selector, guardedListener, {
      equalityFn: options?.equality,
      fireImmediately: options?.fireImmediately,
    });
  }

  /**
   * Registers a presentation id provider. Providers are called with the
   * composition-shaped viewport candidate (viewportId, displaySetInstanceUIDs,
   * viewportOptions, displaySetOptions, viewportLabel, compositionRevision):
   * pane geometry (x/y/width/height, positionId) and isReady are NOT included,
   * unlike the pre-store implementation which passed the full grid entry.
   */
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

  /**
   * Deprecated. The service owns its state via the grid store; the provider
   * no longer implements it. Kept as a warn-once no-op so existing callers
   * (and third party providers) do not break.
   */
  public setServiceImplementation(_implementation?: unknown): void {
    if (this._hasWarnedSetServiceImplementation) {
      return;
    }
    this._hasWarnedSetServiceImplementation = true;
    console.warn(
      'ViewportGridService.setServiceImplementation is deprecated and is a no-op; the service is backed by the viewport grid store.'
    );
  }

  /**
   * Manual VIEWPORTS_READY publish, unconditional with respect to readiness
   * (matching the old unconditional-manual semantics) and synchronous,
   * bug-for-bug with the pre-store implementation. It only participates in
   * the per-layoutRevision dedupe when the grid is actually mounted: a
   * premature manual call (allMounted still false) broadcasts but does NOT
   * consume the revision's publish slot, so the automatic bridge still fires
   * for the genuine all-mounted transition; a mounted manual call marks the
   * revision so the bridge cannot double-fire afterwards, and any call for an
   * already-published revision is a no-op.
   */
  public publishViewportsReady() {
    const state = this._store.getState();
    const { layoutRevision } = state.layout;
    if (layoutRevision <= this._publishedReadyLayoutRevision) {
      return;
    }
    if (state.derived.allMounted) {
      this._publishedReadyLayoutRevision = layoutRevision;
    }
    this._broadcastEvent(this.EVENTS.VIEWPORTS_READY, {});
  }

  public publishViewportOnDropHandled(eventData) {
    this._broadcastEvent(this.EVENTS.VIEWPORT_ONDROP_HANDLED, { eventData });
  }

  public setActiveViewportId(id: string) {
    if (id === this._store.getState().activeViewportId) {
      return;
    }
    this._store.getState().setActiveViewport(id);

    // Deferred broadcast, preserved from the pre-store implementation.
    setTimeout(() => {
      this._broadcastEvent(this.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED, {
        viewportId: id,
      });
    }, 0);
  }

  public getState(): AppTypes.ViewportGrid.State {
    return assembleLegacyState(this._store.getState()) as unknown as AppTypes.ViewportGrid.State;
  }

  /**
   * Returns the legacy-shaped viewport entry (composition merged with pane
   * geometry and isReady).
   *
   * @deprecated Use `getViewportComposition` for the grid entry and
   * `cornerstoneViewportService.getViewportRuntime` for live viewport state.
   */
  public getViewportState(viewportId: string) {
    return this.getState().viewports.get(viewportId);
  }

  /**
   * Returns the viewport composition (what the viewport should show) from the
   * grid store, including its compositionRevision.
   */
  public getViewportComposition(viewportId: string): ViewportComposition | undefined {
    return this._store.getState().viewports.get(viewportId);
  }

  /**
   * Compatibility shim for the historical isReady boolean: truthy reports the
   * mounted phase for the viewport's current composition revision, falsy
   * resets the runtime entry to detached.
   */
  public setViewportIsReady(viewportId: string, isReady: unknown) {
    const composition = this._store.getState().viewports.get(viewportId);
    if (!composition) {
      return;
    }
    if (isReady) {
      this._store.getState().reportPhase(viewportId, 'mounted', composition.compositionRevision);
    } else {
      this._store.getState().detachRuntime(viewportId);
    }
  }

  /**
   * True when every content viewport has mounted its current composition.
   */
  public getGridViewportsReady(): boolean {
    return this._store.getState().derived.allMounted;
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
    this._store.getState().setDisplaySets(viewportsToUpdate as SetDisplaySetsUpdate[]);
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

    this._store.getState().applyLayout({
      numCols,
      numRows,
      layoutOptions,
      layoutType,
      activeViewportId,
      findOrCreateViewport,
      isHangingProtocolLayout,
    });

    // Deferred broadcasts, preserved from the pre-store implementation:
    // LAYOUT_CHANGED first, then GRID_STATE_CHANGED in the same macrotask.
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
    this._store.getState().reset();
  }

  /**
   * The onModeExit must set the state of the viewport grid to a standard/clean
   * state.  To implement store/recover of the viewport grid, perform
   * a state store in the mode or extension onModeExit, and recover that
   * data if appropriate in the onModeEnter of the mode or extension.
   */
  public onModeExit(): void {
    this._store.getState().reset();
  }

  public set(newState) {
    const prevState = this.getState();
    const prevViewportIds = new Set(prevState.viewports.keys());

    this._store.getState().set(this._legacyToStorePartial(newState));

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
    const state = this.getState();
    const { layout, viewports } = state;
    const { numRows, numCols } = layout;
    return Math.min(viewports.size, numCols * numRows);
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

  /**
   * Matches the stub the provider used to inject; the cornerstone extension
   * answers reference viewability through its own services.
   */
  public isReferenceViewable(viewportId?: string, viewRef?: unknown, options?: unknown): boolean {
    return false;
  }

  // Runtime and transaction passthroughs to the grid store.

  public reportPhase(viewportId: string, phase: ViewportRuntimePhase, forRevision: number): void {
    this._store.getState().reportPhase(viewportId, phase, forRevision);
  }

  public beginWork(viewportId: string, token: string): void {
    this._store.getState().beginWork(viewportId, token);
  }

  public endWork(viewportId: string, token: string): void {
    this._store.getState().endWork(viewportId, token);
  }

  public bumpComposition(viewportId: string, reason?: string): void {
    this._store.getState().bumpComposition(viewportId, reason);
  }

  public snapshot(): ViewportGridSnapshot {
    return this._store.getState().snapshot();
  }

  public restore(snapshot: ViewportGridSnapshot): void {
    this._store.getState().restore(snapshot);
  }

  /**
   * Translates a legacy-shaped partial state (viewport entries carrying pane
   * geometry, layout without panes) into the store's slices. Compositions get
   * fresh revisions relative to the current store entries, so consumers treat
   * a set() as a content change, as they did before the store.
   */
  private _legacyToStorePartial(newState): Partial<Omit<ViewportGridStoreState, 'derived'>> {
    const storeState = this._store.getState();
    const partial: Partial<Omit<ViewportGridStoreState, 'derived'>> = {};

    if ('activeViewportId' in newState) {
      partial.activeViewportId = newState.activeViewportId;
    }
    if ('isHangingProtocolLayout' in newState) {
      partial.isHangingProtocolLayout = newState.isHangingProtocolLayout;
    }

    const numRows = newState.layout?.numRows ?? storeState.layout.numRows;
    const numCols = newState.layout?.numCols ?? storeState.layout.numCols;
    const layoutType = newState.layout?.layoutType ?? storeState.layout.layoutType;

    if (newState.viewports) {
      const viewports = new Map<string, ViewportComposition>();
      const runtime = new Map<string, ViewportRuntimeEntry>();
      const panes: PaneGeometry[] = [];

      newState.viewports.forEach((entry, viewportId) => {
        const previous = storeState.viewports.get(viewportId);
        const compositionRevision = (previous?.compositionRevision ?? 0) + 1;
        viewports.set(viewportId, {
          viewportId,
          displaySetInstanceUIDs: [...(entry.displaySetInstanceUIDs || [])],
          viewportOptions: entry.viewportOptions || {},
          displaySetOptions: entry.displaySetOptions || [],
          displaySetSelectors: entry.displaySetSelectors || [],
          viewportLabel: entry.viewportLabel ?? null,
          compositionRevision,
        });

        // The old SET reducer shallow-merged the payload, so a snapshot taken
        // while the layout was live restored with its isReady flags intact.
        // Reused viewportIds keep their enabled elements and never re-report
        // mounted, so the flag must be seeded here at the fresh revision.
        runtime.set(viewportId, {
          phase: entry.isReady ? 'mounted' : 'detached',
          forRevision: compositionRevision,
          pendingWork: 0,
        });

        const x = entry.x ?? 0;
        const y = entry.y ?? 0;
        panes.push({
          viewportId,
          positionId: entry.positionId ?? `${Math.round(x * numCols)}-${Math.round(y * numRows)}`,
          x,
          y,
          width: entry.width ?? 0,
          height: entry.height ?? 0,
        });
      });

      partial.viewports = viewports;
      partial.runtime = runtime;
      partial.layout = {
        layoutType,
        numRows,
        numCols,
        panes,
        layoutRevision: storeState.layout.layoutRevision + 1,
      };
    } else if (newState.layout) {
      partial.layout = {
        ...storeState.layout,
        layoutType,
        numRows,
        numCols,
        layoutRevision: storeState.layout.layoutRevision + 1,
      };
    }

    return partial;
  }
}

export default ViewportGridService;
