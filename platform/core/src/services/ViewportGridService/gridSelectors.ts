import type { GridLayout, ViewportComposition, ViewportGridStoreState } from './gridStore';

export type StabilityLevel = 'mounted' | 'rendered' | 'settled';

export interface StabilitySelection {
  isStable: boolean;
  epoch: number;
  pending: string[];
}

const STABILITY_KEYS: Record<StabilityLevel, 'allMounted' | 'allRendered' | 'allSettled'> = {
  mounted: 'allMounted',
  rendered: 'allRendered',
  settled: 'allSettled',
};

export const selectLayout = (state: ViewportGridStoreState): GridLayout => state.layout;

export const selectActiveViewportId = (state: ViewportGridStoreState): string | null =>
  state.activeViewportId;

export const selectViewport =
  (viewportId: string) =>
  (state: ViewportGridStoreState): ViewportComposition | undefined =>
    state.viewports.get(viewportId);

export const selectIsActive =
  (viewportId: string) =>
  (state: ViewportGridStoreState): boolean =>
    state.activeViewportId === viewportId;

export const selectStability =
  (level: StabilityLevel) =>
  (state: ViewportGridStoreState): StabilitySelection => ({
    isStable: state.derived[STABILITY_KEYS[level]],
    epoch: state.derived.epoch,
    pending: state.derived.pendingViewportIds,
  });

/**
 * One-level equality for selector results that are freshly built objects (eg
 * selectStability). Nested values are compared with Object.is, which works
 * because the store keeps identities stable for unchanged slices.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) {
    return false;
  }
  return keysA.every(
    key =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}
