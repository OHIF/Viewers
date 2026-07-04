import { useMemo } from 'react';
import { useSystem } from '@ohif/core';
// The typed wrapper around use-sync-external-store/shim/with-selector; same
// binding the ViewportGridProvider selector overload uses.
import { useStoreWithEqualityFn } from 'zustand/traditional';

import type { ViewportRuntimeSnapshot } from '../services/ViewportService/viewportRuntime';

const identity = (snapshot: ViewportRuntimeSnapshot) => snapshot;

/**
 * Reads the per-viewport runtime state (plan section 4.7): the CS3D-backed
 * snapshot exposed by cornerstoneViewportService.getViewportRuntime, cached per
 * revision, with re-renders driven by subscribeViewportRuntime.
 *
 * Without a selector it returns the whole snapshot (re-rendering on every
 * runtime revision). With a selector it re-renders only when the selected
 * value changes:
 *
 *   const { sliceIndex, numSlices } = useViewportState(
 *     viewportId,
 *     s => ({ sliceIndex: s.sliceIndex, numSlices: s.numSlices }),
 *     shallowEqual
 *   );
 */
export function useViewportState(viewportId: string): ViewportRuntimeSnapshot;
export function useViewportState<T>(
  viewportId: string,
  selector: (snapshot: ViewportRuntimeSnapshot) => T,
  equality?: (a: T, b: T) => boolean
): T;
export function useViewportState<T>(
  viewportId: string,
  selector?: (snapshot: ViewportRuntimeSnapshot) => T,
  equality?: (a: T, b: T) => boolean
): T | ViewportRuntimeSnapshot {
  const { servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;

  // A store-shaped view over the runtime channel: the snapshot is stable per
  // revision (required by useSyncExternalStore) and the subscription returns
  // an unsubscribe function. The channel notifies without arguments; React's
  // store-change handler ignores them, so the listener cast is safe.
  const runtimeStore = useMemo(() => {
    const getState = (): ViewportRuntimeSnapshot =>
      cornerstoneViewportService.getViewportRuntime(viewportId);
    return {
      subscribe: (
        listener: (state: ViewportRuntimeSnapshot, previousState: ViewportRuntimeSnapshot) => void
      ) => cornerstoneViewportService.subscribeViewportRuntime(viewportId, listener as () => void),
      getState,
      getInitialState: getState,
    };
  }, [cornerstoneViewportService, viewportId]);

  return useStoreWithEqualityFn(
    runtimeStore,
    (selector ?? identity) as (snapshot: ViewportRuntimeSnapshot) => T,
    equality
  );
}
