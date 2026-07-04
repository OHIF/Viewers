import { createStore, StoreApi } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import merge from 'lodash.merge';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';

import uuidv4 from '../../utils/uuidv4';
import type { GridViewportOptions } from '../../types/ViewportGridType';

/**
 * The viewport grid store separates the four kinds of "viewport state":
 * - layout: grid structure and pane geometry (layout.panes), owned here
 * - composition: what each viewport should show (viewports map), owned here
 * - runtime: lifecycle of what each viewport is showing, reported into here
 * - derived: aggregate stability, recomputed inside every transaction
 *
 * Revisions join the layers: every composition change bumps compositionRevision,
 * every runtime report carries forRevision, and stale reports become inert.
 */

export type ViewportRuntimePhase =
  | 'detached'
  | 'mounting'
  | 'mounted'
  | 'rendered'
  | 'settled'
  | 'error';

export interface PaneGeometry {
  viewportId: string;
  positionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridLayout {
  layoutType: string;
  numRows: number;
  numCols: number;
  panes: PaneGeometry[];
  layoutRevision: number;
}

export interface ViewportComposition {
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions: GridViewportOptions;
  displaySetOptions: unknown[];
  displaySetSelectors: unknown[];
  viewportLabel: string | null;
  compositionRevision: number;
}

export interface ViewportRuntimeEntry {
  forRevision: number;
  phase: ViewportRuntimePhase;
  pendingWork: number;
}

export interface DerivedGridState {
  epoch: number;
  allMounted: boolean;
  allRendered: boolean;
  allSettled: boolean;
  pendingViewportIds: string[];
}

export interface ViewportGridStoreState {
  layout: GridLayout;
  activeViewportId: string | null;
  isHangingProtocolLayout: boolean;
  viewports: Map<string, ViewportComposition>;
  runtime: Map<string, ViewportRuntimeEntry>;
  derived: DerivedGridState;
}

export interface ApplyLayoutProps {
  numCols: number;
  numRows: number;
  layoutOptions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    positionId?: string;
  }>;
  layoutType?: string;
  activeViewportId?: string;
  findOrCreateViewport: (
    position: number,
    positionId: string,
    options: Record<string, unknown>
  ) =>
    | {
        viewportId?: string;
        displaySetInstanceUIDs?: string[];
        viewportOptions?: GridViewportOptions;
        displaySetOptions?: unknown[];
        displaySetSelectors?: unknown[];
        viewportLabel?: string | null;
      }
    | undefined;
  isHangingProtocolLayout?: boolean;
}

export interface SetDisplaySetsUpdate {
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions?: GridViewportOptions;
  displaySetOptions?: unknown[];
}

export interface ViewportGridSnapshot {
  layout: GridLayout;
  activeViewportId: string | null;
  isHangingProtocolLayout: boolean;
  viewports: Record<string, ViewportComposition>;
  runtime: Record<string, ViewportRuntimeEntry>;
  derived: DerivedGridState;
}

export type GetPresentationIds = (args: {
  viewport: ViewportComposition;
  viewports: Map<string, ViewportComposition>;
}) => GridViewportOptions['presentationIds'];

export interface ViewportGridStoreActions {
  applyLayout: (props: ApplyLayoutProps) => void;
  setDisplaySets: (updates: SetDisplaySetsUpdate[]) => void;
  setActiveViewport: (viewportId: string | null) => void;
  set: (partial: Partial<Omit<ViewportGridStoreState, 'derived'>>) => void;
  reset: () => void;
  bumpComposition: (viewportId: string, reason?: string) => void;
  reportPhase: (viewportId: string, phase: ViewportRuntimePhase, forRevision: number) => void;
  detachRuntime: (viewportId: string) => void;
  beginWork: (viewportId: string, token: string) => void;
  endWork: (viewportId: string, token: string) => void;
  snapshot: () => ViewportGridSnapshot;
  restore: (snapshot: ViewportGridSnapshot) => void;
}

export type ViewportGridStore = StoreApi<ViewportGridStoreState & ViewportGridStoreActions> & {
  subscribe: {
    (
      listener: (
        state: ViewportGridStoreState & ViewportGridStoreActions,
        previousState: ViewportGridStoreState & ViewportGridStoreActions
      ) => void
    ): () => void;
    <U>(
      selector: (state: ViewportGridStoreState & ViewportGridStoreActions) => U,
      listener: (selectedState: U, previousSelectedState: U) => void,
      options?: {
        equalityFn?: (a: U, b: U) => boolean;
        fireImmediately?: boolean;
      }
    ): () => void;
  };
};

const PHASE_ORDER: Record<Exclude<ViewportRuntimePhase, 'error'>, number> = {
  detached: 0,
  mounting: 1,
  mounted: 2,
  rendered: 3,
  settled: 4,
};

function phaseAtLeast(
  phase: ViewportRuntimePhase,
  level: 'mounted' | 'rendered' | 'settled'
): boolean {
  return phase !== 'error' && PHASE_ORDER[phase] >= PHASE_ORDER[level];
}

function detachedRuntimeEntry(forRevision: number): ViewportRuntimeEntry {
  return { phase: 'detached', forRevision, pendingWork: 0 };
}

function sameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Content equality for compositions (everything but compositionRevision).
 * Used by applyLayout to decide whether a surviving viewport's composition
 * actually changed: the revision must bump only when it did, because a
 * viewport whose element survives a plain layout change never remounts and
 * never re-reports its runtime phase for a fresh revision.
 */
function sameCompositionContent(a: ViewportComposition, b: ViewportComposition): boolean {
  return (
    a.viewportId === b.viewportId &&
    a.viewportLabel === b.viewportLabel &&
    sameStringArray(a.displaySetInstanceUIDs, b.displaySetInstanceUIDs) &&
    isEqual(a.viewportOptions, b.viewportOptions) &&
    isEqual(a.displaySetOptions, b.displaySetOptions) &&
    isEqual(a.displaySetSelectors, b.displaySetSelectors)
  );
}

/**
 * Recomputes derived stability. Content viewports are the ones with display
 * sets; with zero content viewports every aggregate is false (ported from the
 * provider's getGridViewportsReady semantics). Runtime entries only count when
 * they describe the viewport's current compositionRevision.
 */
function computeDerived(
  viewports: Map<string, ViewportComposition>,
  runtime: Map<string, ViewportRuntimeEntry>,
  previousDerived: DerivedGridState,
  bumpEpoch: boolean
): DerivedGridState {
  const epoch = bumpEpoch ? previousDerived.epoch + 1 : previousDerived.epoch;

  const contentViewports: ViewportComposition[] = [];
  viewports.forEach(viewport => {
    if (viewport.displaySetInstanceUIDs?.length > 0) {
      contentViewports.push(viewport);
    }
  });

  if (contentViewports.length === 0) {
    return {
      epoch,
      allMounted: false,
      allRendered: false,
      allSettled: false,
      pendingViewportIds: sameStringArray(previousDerived.pendingViewportIds, [])
        ? previousDerived.pendingViewportIds
        : [],
    };
  }

  let allMounted = true;
  let allRendered = true;
  let allSettled = true;
  const pendingViewportIds: string[] = [];

  for (const viewport of contentViewports) {
    const entry = runtime.get(viewport.viewportId);
    const isCurrent = !!entry && entry.forRevision === viewport.compositionRevision;
    const isMounted = isCurrent && phaseAtLeast(entry.phase, 'mounted');
    const isRendered = isCurrent && phaseAtLeast(entry.phase, 'rendered');
    const isSettled = isRendered && entry.pendingWork === 0;

    if (!isMounted) {
      allMounted = false;
    }
    if (!isRendered) {
      allRendered = false;
    }
    if (!isSettled) {
      allSettled = false;
      pendingViewportIds.push(viewport.viewportId);
    }
  }

  return {
    epoch,
    allMounted,
    allRendered,
    allSettled,
    // Keep array identity stable while the pending set is unchanged so
    // shallow-equality subscribers do not refire.
    pendingViewportIds: sameStringArray(previousDerived.pendingViewportIds, pendingViewportIds)
      ? previousDerived.pendingViewportIds
      : pendingViewportIds,
  };
}

/**
 * Ported from ViewportGridProvider.determineActiveViewportId: prefer the
 * orientation of the previous active viewport, then any shared
 * displaySetInstanceUID; null when there are no content candidates.
 */
function determineActiveViewportId(
  state: ViewportGridStoreState,
  newViewports: Map<string, ViewportComposition>
): string | null {
  const { activeViewportId } = state;
  const currentActiveViewport = activeViewportId
    ? state.viewports.get(activeViewportId)
    : undefined;

  if (!currentActiveViewport) {
    const firstViewport = newViewports.values().next().value;
    return firstViewport?.viewportOptions?.viewportId ?? null;
  }

  const currentActiveDisplaySetInstanceUIDs = currentActiveViewport.displaySetInstanceUIDs;
  const currentOrientation = currentActiveViewport.viewportOptions.orientation;

  const filteredNewViewports = Array.from(newViewports.values()).filter(
    viewport => viewport.displaySetInstanceUIDs?.length > 0
  );

  const sortedViewports = filteredNewViewports.sort((a, b) => {
    const aOrientationMatch = a.viewportOptions.orientation === currentOrientation;
    const bOrientationMatch = b.viewportOptions.orientation === currentOrientation;
    if (aOrientationMatch !== bOrientationMatch) {
      return Number(bOrientationMatch) - Number(aOrientationMatch);
    }

    const aMatch = a.displaySetInstanceUIDs.some(uid =>
      currentActiveDisplaySetInstanceUIDs.includes(uid)
    );
    const bMatch = b.displaySetInstanceUIDs.some(uid =>
      currentActiveDisplaySetInstanceUIDs.includes(uid)
    );
    if (aMatch !== bMatch) {
      return Number(bMatch) - Number(aMatch);
    }

    return 0;
  });

  if (!sortedViewports?.length) {
    return null;
  }

  return sortedViewports[0].viewportId;
}

/**
 * Ported from the provider's DEFAULT_STATE, including the seeded 'default'
 * viewport whose pane geometry uses width/height 100 (not fractional).
 * Only layoutRevision and epoch stay monotonic across reset; per-viewport
 * compositionRevisions restart, so a pre-reset runtime report that carries its
 * forRevision across an async boundary is NOT guaranteed inert against a
 * recreated viewportId. Pipelines that defer reportPhase must re-read the
 * current compositionRevision at report time (setViewportIsReady does).
 */
function createDefaultGridState(counters: {
  layoutRevision: number;
  epoch: number;
}): ViewportGridStoreState {
  const defaultComposition: ViewportComposition = {
    viewportId: 'default',
    displaySetInstanceUIDs: [],
    viewportOptions: {
      viewportId: 'default',
    },
    displaySetSelectors: [],
    displaySetOptions: [{}],
    viewportLabel: null,
    compositionRevision: 0,
  };

  return {
    layout: {
      layoutType: 'grid',
      numRows: 0,
      numCols: 0,
      panes: [
        {
          viewportId: 'default',
          positionId: '0-0',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ],
      layoutRevision: counters.layoutRevision,
    },
    activeViewportId: null,
    isHangingProtocolLayout: false,
    viewports: new Map([['default', defaultComposition]]),
    runtime: new Map([['default', detachedRuntimeEntry(0)]]),
    derived: {
      epoch: counters.epoch,
      allMounted: false,
      allRendered: false,
      allSettled: false,
      pendingViewportIds: [],
    },
  };
}

function pruneRuntime(
  runtime: Map<string, ViewportRuntimeEntry>,
  viewports: Map<string, ViewportComposition>
): void {
  for (const viewportId of Array.from(runtime.keys())) {
    if (!viewports.has(viewportId)) {
      runtime.delete(viewportId);
    }
  }
}

/**
 * Creates the viewport grid store. getPresentationIds is injected (the service
 * passes its provider-registry method) so the store has no service dependency.
 */
export function createViewportGridStore({
  getPresentationIds,
}: {
  getPresentationIds: GetPresentationIds;
}): ViewportGridStore {
  // Work tokens live outside the state: pendingWork is the observable count,
  // the token set makes beginWork/endWork idempotent per token.
  const workTokens = new Map<string, Set<string>>();

  const store = createStore<ViewportGridStoreState & ViewportGridStoreActions>()(
    subscribeWithSelector((zustandSet, get) => {
      const pruneWorkTokens = (viewports: Map<string, ViewportComposition>) => {
        for (const viewportId of Array.from(workTokens.keys())) {
          if (!viewports.has(viewportId)) {
            workTokens.delete(viewportId);
          }
        }
      };

      const updatePendingWork = (viewportId: string, pendingWork: number) => {
        const state = get();
        const composition = state.viewports.get(viewportId);
        if (!composition) {
          return;
        }
        const entry =
          state.runtime.get(viewportId) ?? detachedRuntimeEntry(composition.compositionRevision);
        if (entry.pendingWork === pendingWork) {
          return;
        }
        const runtime = new Map(state.runtime);
        runtime.set(viewportId, { ...entry, pendingWork });
        zustandSet({
          runtime,
          // Work reports never bump the epoch.
          derived: computeDerived(state.viewports, runtime, state.derived, false),
        });
      };

      return {
        ...createDefaultGridState({ layoutRevision: 0, epoch: 0 }),

        applyLayout: props => {
          const {
            numCols,
            numRows,
            layoutOptions = [],
            layoutType = 'grid',
            activeViewportId,
            findOrCreateViewport,
            isHangingProtocolLayout = false,
          } = props;

          const state = get();

          // Faithful port of the SET_LAYOUT reducer case.
          const hasOptions = layoutOptions?.length;
          const viewports = new Map<string, ViewportComposition>();
          const panes: PaneGeometry[] = [];
          // Temporary state bag findOrCreateViewport can use across positions
          // (eg to track which display sets it has already placed).
          const options: Record<string, unknown> = {};

          let activeViewportIdToSet = activeViewportId;
          for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
              const position = col + row * numCols;
              const layoutOption = layoutOptions[position];

              let xPos, yPos, w, h;
              if (layoutOptions && layoutOptions[position]) {
                ({ x: xPos, y: yPos, width: w, height: h } = layoutOptions[position]);
              } else {
                w = 1 / numCols;
                h = 1 / numRows;
                xPos = col * w;
                yPos = row * h;
              }

              const colIndex = Math.round(xPos * numCols);
              const rowIndex = Math.round(yPos * numRows);

              const positionId = layoutOption?.positionId || `${colIndex}-${rowIndex}`;

              if (hasOptions && position >= layoutOptions.length) {
                continue;
              }

              const found = findOrCreateViewport(position, positionId, options);

              if (!found) {
                continue;
              }

              // Copy everything taken from findOrCreateViewport: its results
              // may alias previous (read-only) state and must not be mutated.
              // Unlike the old reducer, minted viewportIds, geometry and
              // computed presentationIds are NOT written back into the
              // returned object; callers must re-read them from grid state.
              const viewportOptions: GridViewportOptions = { ...(found.viewportOptions || {}) };

              if (!viewportOptions.viewportId) {
                const randomUID = uuidv4().substring(0, 8);
                viewportOptions.viewportId = `viewport-${randomUID}`;
              }

              const viewportId = viewportOptions.viewportId;
              const previous = state.viewports.get(viewportId);

              const composition: ViewportComposition = {
                viewportId,
                displaySetInstanceUIDs: [...(found.displaySetInstanceUIDs || [])],
                viewportOptions,
                displaySetOptions: [...(found.displaySetOptions || [])],
                displaySetSelectors: [...(found.displaySetSelectors || [])],
                viewportLabel: found.viewportLabel ?? null,
                compositionRevision: (previous?.compositionRevision ?? 0) + 1,
              };

              // Geometry belongs to the layout slice, not to the composition.
              viewports.set(viewportId, composition);
              panes.push({ viewportId, positionId, x: xPos, y: yPos, width: w, height: h });

              // Same ordering as the reducer: the candidate is already in the
              // working map when presentation ids are computed.
              if (!viewportOptions.presentationIds) {
                viewportOptions.presentationIds = getPresentationIds({
                  viewport: composition,
                  viewports,
                });
              }

              // A content-identical composition keeps its object (identity,
              // revision) so the runtime carry below applies: the surviving
              // element never remounts on a pure layout change, so a bumped
              // revision would never get a fresh phase report and derived
              // stability would stay false forever.
              if (previous && sameCompositionContent(previous, composition)) {
                viewports.set(viewportId, previous);
              }
            }
          }

          activeViewportIdToSet =
            activeViewportIdToSet ?? determineActiveViewportId(state, viewports);

          const runtime = new Map<string, ViewportRuntimeEntry>();
          viewports.forEach((composition, viewportId) => {
            if (composition === state.viewports.get(viewportId)) {
              // Unchanged composition: carry the runtime entry (and its work
              // tokens) across the layout change; the entry still describes
              // the current revision.
              runtime.set(
                viewportId,
                state.runtime.get(viewportId) ??
                  detachedRuntimeEntry(composition.compositionRevision)
              );
              return;
            }
            runtime.set(viewportId, detachedRuntimeEntry(composition.compositionRevision));
            workTokens.delete(viewportId);
          });
          pruneWorkTokens(viewports);

          zustandSet({
            layout: {
              layoutType,
              numRows,
              numCols,
              panes,
              layoutRevision: state.layout.layoutRevision + 1,
            },
            activeViewportId: activeViewportIdToSet,
            isHangingProtocolLayout,
            viewports,
            runtime,
            derived: computeDerived(viewports, runtime, state.derived, true),
          });
        },

        setDisplaySets: updates => {
          const state = get();
          const viewports = new Map(state.viewports);
          const runtime = new Map(state.runtime);

          // Faithful port of the SET_DISPLAYSETS_FOR_VIEWPORTS reducer case,
          // made immutable: untouched map entries keep identity.
          updates.forEach(updatedViewport => {
            const { viewportId, displaySetInstanceUIDs } = updatedViewport;

            if (!viewportId) {
              throw new Error('ViewportId is required to set display sets for viewport');
            }

            const previousViewport = viewports.get(viewportId);

            // Remove options that were meant for one time usage, on a copy of
            // the previous options; the previous state object stays untouched.
            let previousViewportOptions = previousViewport?.viewportOptions;
            const initialImageOptions = previousViewportOptions?.initialImageOptions as
              | { useOnce?: boolean }
              | null
              | undefined;
            if (initialImageOptions?.useOnce) {
              previousViewportOptions = { ...previousViewportOptions, initialImageOptions: null };
            }

            // Use the newly provided viewportOptions and display set options
            // when provided, and otherwise fall back to the previous ones.
            let viewportOptions: GridViewportOptions = merge(
              {},
              previousViewportOptions,
              updatedViewport?.viewportOptions
            );

            const displaySetOptions = [...(updatedViewport?.displaySetOptions || [])];
            if (!displaySetOptions.length) {
              // Copy all the display set options, assuming a full set of
              // displaySet UID's is provided.
              if (state.isHangingProtocolLayout) {
                displaySetOptions.push(...(previousViewport?.displaySetOptions || []));
              }
              if (!displaySetOptions.length) {
                displaySetOptions.push({});
              }
            }

            // Outside a hanging protocol layout, an update without explicit
            // viewportOptions (eg drag and drop) must not inherit toolGroupId /
            // viewportType from the previous state; programmatically set
            // options are preserved.
            if (!updatedViewport.viewportOptions && !state.isHangingProtocolLayout) {
              viewportOptions = {
                viewportId: viewportOptions.viewportId,
              };
            }

            const composition: ViewportComposition = {
              viewportId,
              displaySetInstanceUIDs: [...(displaySetInstanceUIDs || [])],
              viewportOptions,
              displaySetOptions,
              displaySetSelectors: previousViewport?.displaySetSelectors ?? [],
              viewportLabel: previousViewport?.viewportLabel ?? null,
              compositionRevision: (previousViewport?.compositionRevision ?? 0) + 1,
            };

            // Same ordering as the reducer: presentation ids are computed
            // before the working map is updated with the new entry.
            viewportOptions.presentationIds = getPresentationIds({
              viewport: composition,
              viewports,
            });

            viewports.set(viewportId, composition);

            // Bug-for-bug with the old SET_DISPLAYSETS reducer, which never
            // touched isReady: the runtime phase is carried across a display
            // set swap (the element is reused, so nothing re-reports mounted
            // after the change). The Phase 3 mount pipeline, which re-reports
            // phases on data rebind, is the place to invalidate this instead.
            // Error stays terminal per revision, so it resets to detached.
            const previousEntry = runtime.get(viewportId);
            const carriedPhase =
              previousEntry && previousEntry.phase !== 'error' ? previousEntry.phase : 'detached';
            runtime.set(viewportId, {
              phase: carriedPhase,
              forRevision: composition.compositionRevision,
              pendingWork: 0,
            });
            workTokens.delete(viewportId);
          });

          pruneRuntime(runtime, viewports);
          pruneWorkTokens(viewports);

          zustandSet({
            viewports,
            runtime,
            derived: computeDerived(viewports, runtime, state.derived, true),
          });
        },

        setActiveViewport: viewportId => {
          // Active viewport is neither layout nor composition: no epoch bump.
          zustandSet({ activeViewportId: viewportId });
        },

        set: partial => {
          const state = get();
          const viewports = partial.viewports ?? state.viewports;
          const runtime = new Map(partial.runtime ?? state.runtime);

          // Keep the runtime slice consistent with whatever was merged in.
          viewports.forEach((composition, viewportId) => {
            if (!runtime.has(viewportId)) {
              runtime.set(viewportId, detachedRuntimeEntry(composition.compositionRevision ?? 0));
            }
          });
          pruneRuntime(runtime, viewports);
          pruneWorkTokens(viewports);

          // Epoch semantics match the dedicated transactions: only partials
          // that touch layout, composition or runtime state bump it; an
          // active-viewport-only set() must not suspend stability policies.
          const bumpEpoch = Boolean(partial.viewports || partial.layout || partial.runtime);

          zustandSet({
            ...partial,
            runtime,
            derived: computeDerived(viewports, runtime, state.derived, bumpEpoch),
          });
        },

        reset: () => {
          const state = get();
          workTokens.clear();
          // A fresh deep default every time; no references shared with any
          // previous state. Counters stay monotonic across the reset.
          zustandSet(
            createDefaultGridState({
              layoutRevision: state.layout.layoutRevision + 1,
              epoch: state.derived.epoch + 1,
            })
          );
        },

        bumpComposition: (viewportId, _reason) => {
          const state = get();
          const previous = state.viewports.get(viewportId);
          if (!previous) {
            return;
          }

          const viewports = new Map(state.viewports);
          const composition: ViewportComposition = {
            ...previous,
            compositionRevision: previous.compositionRevision + 1,
          };
          viewports.set(viewportId, composition);

          const runtime = new Map(state.runtime);
          runtime.set(viewportId, detachedRuntimeEntry(composition.compositionRevision));
          workTokens.delete(viewportId);

          zustandSet({
            viewports,
            runtime,
            derived: computeDerived(viewports, runtime, state.derived, true),
          });
        },

        reportPhase: (viewportId, phase, forRevision) => {
          const state = get();
          const composition = state.viewports.get(viewportId);
          if (!composition) {
            // Unknown viewport: never corrupt state.
            return;
          }
          if (forRevision !== composition.compositionRevision) {
            // Stale (or not-yet-known) revisions are inert.
            return;
          }

          const entry =
            state.runtime.get(viewportId) ?? detachedRuntimeEntry(composition.compositionRevision);

          let pendingWork = entry.pendingWork;
          if (entry.forRevision === forRevision) {
            if (entry.phase === 'error') {
              // Error is terminal within a revision; a fresh revision resets.
              return;
            }
            if (phase !== 'error' && PHASE_ORDER[phase] <= PHASE_ORDER[entry.phase]) {
              // Phases only move forward within a revision.
              return;
            }
          } else {
            // First report for a fresh revision resets the entry.
            pendingWork = 0;
            workTokens.delete(viewportId);
          }

          const runtime = new Map(state.runtime);
          runtime.set(viewportId, { phase, forRevision, pendingWork });

          zustandSet({
            runtime,
            // Runtime reports never bump the epoch.
            derived: computeDerived(state.viewports, runtime, state.derived, false),
          });
        },

        detachRuntime: viewportId => {
          const state = get();
          const composition = state.viewports.get(viewportId);
          if (!composition) {
            return;
          }
          // Clear the work tokens even when the entry is already detached, so
          // a later beginWork cannot resurrect stale pre-detach tokens.
          workTokens.delete(viewportId);

          const entry = state.runtime.get(viewportId);
          if (
            entry &&
            entry.phase === 'detached' &&
            entry.forRevision === composition.compositionRevision &&
            entry.pendingWork === 0
          ) {
            return;
          }

          const runtime = new Map(state.runtime);
          runtime.set(viewportId, detachedRuntimeEntry(composition.compositionRevision));

          zustandSet({
            runtime,
            // Detaching is a runtime change: never bumps the epoch.
            derived: computeDerived(state.viewports, runtime, state.derived, false),
          });
        },

        beginWork: (viewportId, token) => {
          const state = get();
          if (!state.viewports.has(viewportId)) {
            return;
          }
          let tokens = workTokens.get(viewportId);
          if (tokens?.has(token)) {
            return;
          }
          if (!tokens) {
            tokens = new Set();
            workTokens.set(viewportId, tokens);
          }
          tokens.add(token);
          updatePendingWork(viewportId, tokens.size);
        },

        endWork: (viewportId, token) => {
          const tokens = workTokens.get(viewportId);
          if (!tokens?.has(token)) {
            // Double-end (or end after a composition change) is safe.
            return;
          }
          tokens.delete(token);
          updatePendingWork(viewportId, tokens.size);
        },

        snapshot: () => {
          const state = get();
          return cloneDeep({
            layout: state.layout,
            activeViewportId: state.activeViewportId,
            isHangingProtocolLayout: state.isHangingProtocolLayout,
            viewports: Object.fromEntries(state.viewports),
            runtime: Object.fromEntries(state.runtime),
            derived: state.derived,
          });
        },

        restore: snapshot => {
          const state = get();
          // Deep-copy on the way in as well, so later mutations of the caller's
          // snapshot object cannot reach into the store.
          const data = cloneDeep(snapshot);
          const viewports = new Map(Object.entries(data.viewports));
          const runtime = new Map(Object.entries(data.runtime));

          workTokens.clear();
          viewports.forEach((composition, viewportId) => {
            if (!runtime.has(viewportId)) {
              runtime.set(viewportId, detachedRuntimeEntry(composition.compositionRevision));
            }
          });
          pruneRuntime(runtime, viewports);

          zustandSet({
            layout: { ...data.layout, layoutRevision: state.layout.layoutRevision + 1 },
            activeViewportId: data.activeViewportId,
            isHangingProtocolLayout: data.isHangingProtocolLayout,
            viewports,
            runtime,
            derived: computeDerived(viewports, runtime, state.derived, true),
          });
        },
      };
    })
  );

  return store as ViewportGridStore;
}

/**
 * The legacy AppTypes.ViewportGrid.State shape, assembled from the store
 * slices: pane geometry merged back onto the viewport entries and isReady
 * derived from the runtime phase for the current composition revision.
 */
export interface LegacyViewportEntry {
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions: GridViewportOptions;
  displaySetOptions: unknown[];
  displaySetSelectors: unknown[];
  viewportLabel: string | null;
  positionId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isReady: boolean;
}

export interface LegacyViewportGridState {
  activeViewportId: string | null;
  layout: { numRows: number; numCols: number; layoutType: string };
  isHangingProtocolLayout: boolean;
  viewports: Map<string, LegacyViewportEntry>;
}

// Cached per state object identity: zustand replaces the state object on every
// accepted transaction (layout, composition, runtime, active viewport), so
// repeated calls between changes return the same object, and any change - not
// just epoch bumps - produces a fresh assembly.
const legacyStateCache = new WeakMap<ViewportGridStoreState, LegacyViewportGridState>();

// Entry-level cache keyed on the composition object, which keeps identity
// across transactions that do not touch it: an untouched legacy entry keeps
// identity too, so consumers keying effects or memos on an entry do not refire
// on unrelated transactions (the old reducer had the same property).
const legacyEntryCache = new WeakMap<
  ViewportComposition,
  { pane: PaneGeometry | undefined; isReady: boolean; entry: LegacyViewportEntry }
>();

// Keyed on the store's viewports Map, whose identity survives runtime-only and
// active-viewport transactions: when no entry changed, the assembled legacy
// Map keeps its identity as well (the old reducer kept the Map across
// SET_ACTIVE_VIEWPORT_ID).
const legacyViewportsMapCache = new WeakMap<
  Map<string, ViewportComposition>,
  Map<string, LegacyViewportEntry>
>();

export function assembleLegacyState(state: ViewportGridStoreState): LegacyViewportGridState {
  const cached = legacyStateCache.get(state);
  if (cached) {
    return cached;
  }

  // Later panes win when a viewportId appears twice, matching the reducer's
  // last-write-wins geometry assignment.
  const paneByViewportId = new Map<string, PaneGeometry>();
  state.layout.panes.forEach(pane => paneByViewportId.set(pane.viewportId, pane));

  const previousViewports = legacyViewportsMapCache.get(state.viewports);
  let allEntriesReused = previousViewports?.size === state.viewports.size;

  let viewports: LegacyViewportGridState['viewports'] = new Map();
  state.viewports.forEach((composition, viewportId) => {
    const pane = paneByViewportId.get(viewportId);
    const runtimeEntry = state.runtime.get(viewportId);
    const isReady =
      !!runtimeEntry &&
      runtimeEntry.forRevision === composition.compositionRevision &&
      phaseAtLeast(runtimeEntry.phase, 'mounted');

    // Compositions and panes are immutable per transaction, so identity
    // comparison is enough to reuse the previously assembled entry.
    const cachedEntry = legacyEntryCache.get(composition);
    let entry: LegacyViewportEntry;
    if (cachedEntry && cachedEntry.pane === pane && cachedEntry.isReady === isReady) {
      entry = cachedEntry.entry;
    } else {
      entry = {
        viewportId,
        displaySetInstanceUIDs: composition.displaySetInstanceUIDs,
        viewportOptions: composition.viewportOptions,
        displaySetOptions: composition.displaySetOptions,
        displaySetSelectors: composition.displaySetSelectors,
        viewportLabel: composition.viewportLabel,
        positionId: pane?.positionId,
        x: pane?.x ?? 0,
        y: pane?.y ?? 0,
        width: pane?.width ?? 0,
        height: pane?.height ?? 0,
        isReady,
      };
      legacyEntryCache.set(composition, { pane, isReady, entry });
    }

    if (allEntriesReused && previousViewports.get(viewportId) !== entry) {
      allEntriesReused = false;
    }
    viewports.set(viewportId, entry);
  });

  if (allEntriesReused && previousViewports) {
    viewports = previousViewports;
  } else {
    legacyViewportsMapCache.set(state.viewports, viewports);
  }

  const legacyState: LegacyViewportGridState = {
    activeViewportId: state.activeViewportId,
    layout: {
      numRows: state.layout.numRows,
      numCols: state.layout.numCols,
      layoutType: state.layout.layoutType,
    },
    isHangingProtocolLayout: state.isHangingProtocolLayout,
    viewports,
  };

  legacyStateCache.set(state, legacyState);
  return legacyState;
}
