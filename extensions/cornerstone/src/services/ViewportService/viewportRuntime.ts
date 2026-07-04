import { Enums, eventTarget } from '@cornerstonejs/core';
import type { Types as CoreTypes } from '@cornerstonejs/core';
import type { ViewportRuntimePhase } from '@ohif/core';

import { getViewportAdapter } from './adapter';
import type {
  ViewportPresentation,
  ViewportShape,
  ViewportViewState,
} from './adapter/IViewportAdapter';
import {
  getSliceEventName,
  getViewportSliceCount,
  isVolumeViewportData,
} from '../../utils/viewportDataShape';

/**
 * The per-viewport runtime channel (plan section 4.7): one revision counter per
 * mounted viewport, bumped by adapter-normalized cornerstone events, with the
 * snapshot computed lazily as a read-through over the live viewport (via
 * IViewportAdapter) and cached per revision. CS3D stays the source of truth;
 * nothing continuous is copied into OHIF state.
 */

export interface ViewportRuntimeSnapshot {
  revision: number;
  phase: ViewportRuntimePhase;
  shape: ViewportShape;
  displaySetInstanceUIDs: string[];
  viewReference?: CoreTypes.ViewReference;
  viewState?: ViewportViewState;
  presentation?: ViewportPresentation;
  sliceIndex?: number;
  numSlices?: number;
}

// Structurally matches the (non-exported) shape viewportDataShape.ts accepts.
type ViewportDatumLike = {
  imageIds?: string[];
  volume?: unknown;
  volumeId?: string;
  displaySetInstanceUID?: string;
  [key: string]: unknown;
};

type ViewportDataLike = {
  viewportType?: Enums.ViewportType;
  dataShapeType?: Enums.ViewportType;
  data?: ViewportDatumLike | ViewportDatumLike[];
};

type ViewportInfoLike = {
  getElement: () => HTMLDivElement | undefined;
  getViewportData: () => ViewportDataLike | undefined;
};

type CornerstoneViewportLike = {
  getViewReference?: () => CoreTypes.ViewReference | undefined;
  getCurrentImageIdIndex?: () => number;
  getNumberOfSlices: () => number;
  viewportStatus?: Enums.ViewportStatus;
};

export interface ViewportRuntimeManagerArgs {
  servicesManager: AppTypes.ServicesManager;
  // Returns the live cornerstone viewport (any family) or null when disabled.
  getCornerstoneViewport: (viewportId: string) => unknown;
  getViewportInfo: (viewportId: string) => ViewportInfoLike | undefined;
}

export interface ViewportRuntimeManager {
  /** Wires element listeners for a viewport after a successful data mount. */
  bind: (viewportId: string) => void;
  /** Removes all listeners for a viewport (element teardown / rebind). */
  release: (viewportId: string) => void;
  /** Lazily computed snapshot, referentially stable per revision. */
  get: (viewportId: string) => ViewportRuntimeSnapshot;
  /** Change notification; returns an unsubscribe function. */
  subscribe: (viewportId: string, callback: () => void) => () => void;
  /** Releases every binding and clears all subscribers. */
  destroy: () => void;
}

type ListenerRegistration = {
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  eventName: string;
  handler: EventListenerOrEventListenerObject;
};

interface Binding {
  element: HTMLElement;
  handlers: ListenerRegistration[];
  raf: number | null;
  /** compositionRevision the mount that created this binding belongs to. */
  boundRevision: number;
  firstRenderReported: boolean;
  /** Held grid work token while the bound volumes are still streaming. */
  workToken: string | null;
  /** Disposer for the grid-store runtime-slice mirror subscription. */
  gridUnsubscribe: (() => void) | null;
}

function toDataArray(viewportData: ViewportDataLike | undefined): ViewportDatumLike[] {
  const data = viewportData?.data;
  if (Array.isArray(data)) {
    return data.filter(Boolean);
  }
  return data ? [data] : [];
}

export function createViewportRuntimeManager({
  servicesManager,
  getCornerstoneViewport,
  getViewportInfo,
}: ViewportRuntimeManagerArgs): ViewportRuntimeManager {
  const bindings = new Map<string, Binding>();
  // Revisions outlive bindings so a subscriber holding a pre-release snapshot
  // still sees a strictly increasing revision after a rebind.
  const revisions = new Map<string, number>();
  const subscribers = new Map<string, Set<() => void>>();
  const snapshotCache = new Map<string, ViewportRuntimeSnapshot>();

  // Optional-chained everywhere: the runtime channel must not crash when it
  // runs against a grid service that predates the store-backed facade.
  const getGridService = () => servicesManager.services?.viewportGridService;

  const notify = (viewportId: string) => {
    subscribers.get(viewportId)?.forEach(callback => callback());
  };

  const bump = (viewportId: string) => {
    revisions.set(viewportId, (revisions.get(viewportId) ?? 0) + 1);
    snapshotCache.delete(viewportId);
    notify(viewportId);
  };

  const readPhase = (viewportId: string, binding: Binding | undefined): ViewportRuntimePhase => {
    // Prefer the real grid runtime entry (the store's runtime slice) so the
    // snapshot phase includes settled/error states reported by other writers.
    const storeState = getGridService()?.getStore?.()?.getState?.();
    if (storeState?.runtime && storeState?.viewports) {
      const entry = storeState.runtime.get(viewportId);
      const composition = storeState.viewports.get(viewportId);
      if (entry && composition) {
        // A runtime entry for an older composition describes stale content.
        return entry.forRevision === composition.compositionRevision ? entry.phase : 'detached';
      }
    }
    // Fallback when the grid store is unavailable: a live cornerstone viewport
    // is at least mounted; local first-render tracking upgrades it.
    return binding?.firstRenderReported ? 'rendered' : 'mounted';
  };

  const computeSnapshot = (viewportId: string): ViewportRuntimeSnapshot => {
    const revision = revisions.get(viewportId) ?? 0;
    const viewport = getCornerstoneViewport(viewportId) as CornerstoneViewportLike | null;

    if (!viewport) {
      return {
        revision,
        phase: 'detached',
        shape: 'unknown',
        displaySetInstanceUIDs: [],
      };
    }

    const viewportData = getViewportInfo(viewportId)?.getViewportData?.();
    const adapter = getViewportAdapter(viewport);
    const dataArray = toDataArray(viewportData);

    const snapshot: ViewportRuntimeSnapshot = {
      revision,
      phase: readPhase(viewportId, bindings.get(viewportId)),
      shape: adapter.getShape(),
      displaySetInstanceUIDs: dataArray.map(datum => datum.displaySetInstanceUID).filter(Boolean),
      viewReference: viewport.getViewReference?.(),
      viewState: adapter.getViewState(),
      presentation: adapter.getPresentation(),
    };

    // Same slice computation the image scrollbar uses (viewportDataShape);
    // slice position is not meaningful on 3D volume renderings.
    if (viewportData && snapshot.shape !== 'volume3d') {
      try {
        snapshot.sliceIndex = viewport.getCurrentImageIdIndex?.();
        snapshot.numSlices = getViewportSliceCount(viewportData, viewport);
      } catch (error) {
        // Premature read while the viewport is still binding; leave undefined.
      }
    }

    return snapshot;
  };

  const get = (viewportId: string): ViewportRuntimeSnapshot => {
    let snapshot = snapshotCache.get(viewportId);
    if (!snapshot) {
      snapshot = computeSnapshot(viewportId);
      snapshotCache.set(viewportId, snapshot);
    }
    return snapshot;
  };

  const endVolumeWork = (viewportId: string, binding: Binding) => {
    if (!binding.workToken) {
      return;
    }
    const token = binding.workToken;
    binding.workToken = null;
    getGridService()?.endWork?.(viewportId, token);
  };

  /**
   * Volume settled tokens: while any bound volume is still streaming, the grid
   * holds a work token for this viewport (settled flips only when streaming
   * completes). Skipped entirely when the volume ids cannot be determined or
   * the grid facade has no work-token surface (settled == rendered then).
   */
  const wireVolumeWork = (viewportId: string, binding: Binding, viewportData: ViewportDataLike) => {
    if (!isVolumeViewportData(viewportData)) {
      return;
    }
    const gridService = getGridService();
    if (!gridService?.beginWork || !gridService?.endWork) {
      return;
    }

    const pendingVolumeIds = new Set(
      toDataArray(viewportData)
        .filter(
          datum => !(datum.volume as { loadStatus?: { loaded?: boolean } })?.loadStatus?.loaded
        )
        .map(datum => datum.volumeId ?? (datum.volume as { volumeId?: string })?.volumeId)
        .filter(Boolean)
    );

    if (!pendingVolumeIds.size) {
      return;
    }

    binding.workToken = `volume-stream:${viewportId}`;
    gridService.beginWork(viewportId, binding.workToken);

    const onVolumeLoadingCompleted = (evt: CustomEvent<{ volumeId?: string }>) => {
      const volumeId = evt?.detail?.volumeId;
      if (!volumeId || !pendingVolumeIds.has(volumeId)) {
        return;
      }
      pendingVolumeIds.delete(volumeId);
      if (pendingVolumeIds.size === 0) {
        endVolumeWork(viewportId, binding);
      }
    };

    // Volume streaming completion fires on the cornerstone eventTarget (with a
    // volumeId detail), not on the viewport element.
    eventTarget.addEventListener(
      Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED,
      onVolumeLoadingCompleted as EventListener
    );
    binding.handlers.push({
      target: eventTarget,
      eventName: Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED,
      handler: onVolumeLoadingCompleted as EventListener,
    });
  };

  /** Detaches listeners and cancels pending work; returns true when a binding existed. */
  const releaseBinding = (viewportId: string): boolean => {
    const binding = bindings.get(viewportId);
    if (!binding) {
      return false;
    }
    // Dispose the grid mirror first so the endVolumeWork store write below
    // does not re-enter bump mid-release.
    if (binding.gridUnsubscribe) {
      binding.gridUnsubscribe();
      binding.gridUnsubscribe = null;
    }
    binding.handlers.forEach(({ target, eventName, handler }) => {
      target.removeEventListener(eventName, handler);
    });
    binding.handlers.length = 0;
    if (binding.raf !== null) {
      cancelAnimationFrame(binding.raf);
      binding.raf = null;
    }
    endVolumeWork(viewportId, binding);
    bindings.delete(viewportId);
    return true;
  };

  const bind = (viewportId: string) => {
    // Rebinding the same viewport first detaches the previous listeners.
    releaseBinding(viewportId);

    const viewportInfo = getViewportInfo(viewportId);
    const element = viewportInfo?.getElement?.();
    const viewportData = viewportInfo?.getViewportData?.();

    if (!element || !viewportData) {
      // Nothing to wire, but the content changed: invalidate and notify.
      bump(viewportId);
      return;
    }

    const boundRevision =
      getGridService()?.getViewportComposition?.(viewportId)?.compositionRevision ?? 0;

    const binding: Binding = {
      element,
      handlers: [],
      raf: null,
      boundRevision,
      firstRenderReported: false,
      workToken: null,
      gridUnsubscribe: null,
    };

    const addListener = (eventName: string, handler: EventListener) => {
      element.addEventListener(eventName, handler);
      binding.handlers.push({ target: element, eventName, handler });
    };

    const onBump = () => bump(viewportId);

    // Slice navigation (STACK_NEW_IMAGE / VOLUME_NEW_IMAGE). The helper falls
    // back to IMAGE_RENDERED for unknown shapes, which is wired below already.
    const sliceEventName = getSliceEventName(viewportData);
    if (sliceEventName !== Enums.Events.IMAGE_RENDERED) {
      addListener(sliceEventName, onBump);
    }

    addListener(Enums.Events.VOI_MODIFIED, onBump);
    addListener(Enums.Events.COLORMAP_MODIFIED, onBump);

    // Camera moves fire per pointer event; coalesce to one bump per frame.
    addListener(Enums.Events.CAMERA_MODIFIED, () => {
      if (binding.raf !== null) {
        return;
      }
      binding.raf = requestAnimationFrame(() => {
        binding.raf = null;
        bump(viewportId);
      });
    });

    addListener(Enums.Events.IMAGE_RENDERED, () => {
      if (!binding.firstRenderReported) {
        binding.firstRenderReported = true;
        // Report before bumping so subscribers reading the snapshot in their
        // callback already see the rendered phase.
        getGridService()?.reportPhase?.(viewportId, 'rendered', binding.boundRevision);
      }
      bump(viewportId);
    });

    // The final IMAGE_RENDERED of a mount can fire before the mount promise
    // settles (mount bodies with await tails after the render, eg overlay
    // loading), so a fresh binding may never see a render event. When the
    // viewport already reports fully rendered content at bind time, report the
    // phase immediately instead of waiting for a render that may never come.
    const viewport = getCornerstoneViewport(viewportId) as CornerstoneViewportLike | null;
    if (viewport?.viewportStatus === Enums.ViewportStatus.RENDERED) {
      binding.firstRenderReported = true;
      getGridService()?.reportPhase?.(viewportId, 'rendered', binding.boundRevision);
    }

    wireVolumeWork(viewportId, binding, viewportData);

    // Mirror grid-store-only phase transitions (endWork flipping to settled,
    // detachRuntime at mount start, error reports from other writers) into
    // channel bumps, so cached snapshots never serve a stale phase. Installed
    // last so the reports above do not notify subscribers mid-bind; the
    // closing bump below covers them.
    const gridService = getGridService();
    if (typeof gridService?.select === 'function') {
      binding.gridUnsubscribe = gridService.select(
        state => state.runtime.get(viewportId),
        () => bump(viewportId)
      );
    }

    bindings.set(viewportId, binding);
    // Fresh content behind the same viewportId: invalidate and notify.
    bump(viewportId);
  };

  const release = (viewportId: string) => {
    if (releaseBinding(viewportId)) {
      bump(viewportId);
    }
  };

  const subscribe = (viewportId: string, callback: () => void): (() => void) => {
    let callbacks = subscribers.get(viewportId);
    if (!callbacks) {
      callbacks = new Set();
      subscribers.set(viewportId, callbacks);
    }
    callbacks.add(callback);
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        subscribers.delete(viewportId);
      }
    };
  };

  const destroy = () => {
    Array.from(bindings.keys()).forEach(viewportId => releaseBinding(viewportId));
    subscribers.clear();
    snapshotCache.clear();
    revisions.clear();
  };

  return { bind, release, get, subscribe, destroy };
}
