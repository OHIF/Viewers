import React, { createContext, useContext, ReactNode } from 'react';
import PropTypes from 'prop-types';
// useStoreWithEqualityFn is zustand's typed wrapper around
// use-sync-external-store/shim/with-selector. zustand is declared in this
// package's dependencies (matching the version pinned by @ohif/core and the
// app) because this is a direct import: a published @ohif/ui-next consumed
// with strict node_modules resolution must be able to resolve it on its own.
import { useStoreWithEqualityFn } from 'zustand/traditional';

// NOTE: `@ohif/core` is intentionally NOT declared in this package's
// package.json (neither as a dependency nor a peerDependency). It is treated as
// an implicit peer, satisfied by the consuming application via the monorepo
// workspace. Declaring it as `"@ohif/core": "workspace:*"` was tried and
// reverted: the release/publish process does not rewrite `workspace:*` ranges
// inside `peerDependencies`, so the published tarball shipped a literal
// `workspace:*` peer that non-pnpm package managers (npm/yarn) cannot resolve.
// A plain `"*"` range would be an acceptable workaround if we ever want it
// declared, but for now it stays undeclared. Note: the docs site (platform/docs)
// must therefore add `@ohif/core` as a devDependency itself, because pulling in
// the ui-next barrel reaches this module and nothing else anchors the import.
import {
  ViewportGridService,
  assembleLegacyState,
  selectLayout,
  selectActiveViewportId,
  selectViewport,
  selectIsActive,
  selectStability,
  shallowEqual,
} from '@ohif/core';
import type { ViewportGridStoreState } from '@ohif/core';

/**
 * Named grid selectors, re-exported so extensions can write
 * `import { gridSelectors } from '@ohif/ui-next'`. The same functions are
 * exported individually from `@ohif/core`.
 */
export const gridSelectors = {
  selectLayout,
  selectActiveViewportId,
  selectViewport,
  selectIsActive,
  selectStability,
  shallowEqual,
};

/**
 * The actions half of the legacy `useViewportGrid()` tuple. Every member
 * delegates to the ViewportGridService (which owns the grid store); the object
 * itself is created once per service and is referentially stable, so it is
 * safe to use in effect/callback dependency arrays.
 */
export interface ViewportGridApi {
  getState: () => AppTypes.ViewportGrid.State;
  setActiveViewportId: (viewportId: string) => void;
  setDisplaySetsForViewport: (props: any) => void;
  setDisplaySetsForViewports: (props: any[]) => void;
  setLayout: (layout: AppTypes.ViewportGrid.Layout) => void;
  reset: () => void;
  set: (gridLayoutState: Partial<AppTypes.ViewportGrid.State>) => void;
  getNumViewportPanes: () => number;
  setViewportIsReady: (viewportId: string, isReady: boolean) => void;
  getGridViewportsReady: () => boolean;
  getActiveViewportOptionByKey: (key: string) => any;
  setViewportGridSizeChanged: (props?: any) => void;
  publishViewportsReady: () => void;
  getDisplaySetsUIDsForViewport: (viewportId: string) => string[];
  getViewportState: (viewportId: string) => AppTypes.ViewportGrid.Viewport | undefined;
  isReferenceViewable: (viewportId: string, viewRef, options?) => boolean;
  getLayoutOptionsFromState: (
    state: AppTypes.ViewportGrid.State
  ) => { x: number; y: number; width: number; height: number }[];
}

// One api object per service instance, so the tuple's second element keeps a
// stable identity across renders and across provider remounts.
const apiByService = new WeakMap<ViewportGridService, ViewportGridApi>();

function getViewportGridApi(service: ViewportGridService): ViewportGridApi {
  const cached = apiByService.get(service);
  if (cached) {
    return cached;
  }

  const api: ViewportGridApi = {
    getState: () => service.getState(),
    setActiveViewportId: viewportId => service.setActiveViewportId(viewportId),
    setDisplaySetsForViewport: props => service.setDisplaySetsForViewport(props),
    setDisplaySetsForViewports: props => service.setDisplaySetsForViewports(props),
    setLayout: layout =>
      service.setLayout(layout as Parameters<ViewportGridService['setLayout']>[0]),
    reset: () => service.reset(),
    set: gridLayoutState => service.set(gridLayoutState),
    getNumViewportPanes: () => service.getNumViewportPanes(),
    setViewportIsReady: (viewportId, isReady) => service.setViewportIsReady(viewportId, isReady),
    getGridViewportsReady: () => service.getGridViewportsReady(),
    getActiveViewportOptionByKey: (key: string) => {
      const { viewports, activeViewportId } = service.getState();
      return viewports.get(activeViewportId)?.viewportOptions?.[key];
    },
    // The service reads its own current state; the historical props argument
    // carried no information and is intentionally dropped.
    setViewportGridSizeChanged: () => service.setViewportGridSizeChanged(),
    publishViewportsReady: () => service.publishViewportsReady(),
    getDisplaySetsUIDsForViewport: viewportId => service.getDisplaySetsUIDsForViewport(viewportId),
    getViewportState: viewportId => service.getViewportState(viewportId),
    isReferenceViewable: (viewportId, viewRef, options) =>
      service.isReferenceViewable(viewportId, viewRef, options),
    getLayoutOptionsFromState: state => service.getLayoutOptionsFromState(state),
  };

  apiByService.set(service, api);
  return api;
}

/**
 * The context value is the ViewportGridService instance itself (not a tuple
 * and not a state object): the store owns the state, and holding only the
 * service keeps the provider free of render-driven value churn. The exported
 * name is kept for compatibility; consumers should use the hooks below rather
 * than reading the context directly.
 */
export const ViewportGridContext = createContext<ViewportGridService | null>(null);

/** The legacy tuple shape returned by the no-selector `useViewportGrid()`. */
export type ViewportGridContextTuple = [AppTypes.ViewportGrid.State, ViewportGridApi];

interface ViewportGridProviderProps {
  children: ReactNode;
  service: ViewportGridService;
}

export function ViewportGridProvider({ children, service }: ViewportGridProviderProps) {
  return <ViewportGridContext.Provider value={service}>{children}</ViewportGridContext.Provider>;
}

ViewportGridProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.instanceOf(ViewportGridService).isRequired,
};

function useViewportGridService(): ViewportGridService {
  const service = useContext(ViewportGridContext);
  if (!service) {
    // Intentional hardening over the old context default ([DEFAULT_STATE, {}]),
    // which let out-of-provider renders read a fake state and crash later on
    // the first api call. Tests and storybook renders must wrap the component
    // in a ViewportGridProvider with a real service.
    throw new Error('useViewportGrid must be used within a ViewportGridProvider');
  }
  return service;
}

// assembleLegacyState is cached per store-state identity in @ohif/core, so
// this selector returns a referentially stable snapshot between transactions,
// as useSyncExternalStore requires.
const legacyStateSelector = (state: ViewportGridStoreState) => assembleLegacyState(state);

/**
 * Reads viewport grid state.
 *
 * Without arguments it returns the legacy `[state, api]` tuple, re-rendering
 * on every grid store change (deprecated; prefer the selector overload).
 *
 * With a selector it subscribes to the grid STORE state - the new
 * layout/composition/runtime/derived shape, NOT the legacy state shape - and
 * re-renders only when the selected value changes:
 *
 *   const activeViewportId = useViewportGrid(state => state.activeViewportId);
 *   const layout = useViewportGrid(gridSelectors.selectLayout);
 *   const viewport = useViewportGrid(gridSelectors.selectViewport(viewportId));
 *   const stability = useViewportGrid(
 *     gridSelectors.selectStability('rendered'),
 *     gridSelectors.shallowEqual
 *   );
 */
/**
 * @deprecated Use the selector overload (`useViewportGrid(selector)`) for state
 * and `useViewportGridApi()` for actions; the tuple re-renders on every grid change.
 */
export function useViewportGrid(): ViewportGridContextTuple;
export function useViewportGrid<T>(
  selector: (state: ViewportGridStoreState) => T,
  equality?: (a: T, b: T) => boolean
): T;
export function useViewportGrid<T>(
  selector?: (state: ViewportGridStoreState) => T,
  equality?: (a: T, b: T) => boolean
): T | ViewportGridContextTuple {
  const service = useViewportGridService();
  // Both overloads run the exact same hooks; only the returned shape differs.
  const selected = useStoreWithEqualityFn(
    service.getStore(),
    (selector ?? legacyStateSelector) as (state: ViewportGridStoreState) => T,
    equality
  );

  if (selector) {
    return selected;
  }

  return [selected as unknown as AppTypes.ViewportGrid.State, getViewportGridApi(service)];
}

/**
 * Returns the stable grid api object (actions only, no state subscription).
 * Using this never causes a re-render on grid changes.
 */
export function useViewportGridApi(): ViewportGridApi {
  return getViewportGridApi(useViewportGridService());
}
