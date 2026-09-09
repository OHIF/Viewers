import { CONSTANTS } from '@cornerstonejs/core';

/**
 * Projection (MIP) tunables. Every number the feature relies on is named here so
 * it can be found, defaulted and documented in one place.
 *
 * Slab thickness values are in world units (mm) and always mean the TOTAL slab
 * width, centred on the focal plane (planes at focal +/- thickness / 2). The
 * per-lane engine conventions are normalised inside the viewport adapters.
 */

/** Applied on the first projection enable for a layer when no thickness is stored. */
export const DEFAULT_SLAB_THICKNESS = 10;

/**
 * Smallest slab the engine distinguishes from "no slab". Mirrors cornerstone's
 * RENDERING_DEFAULTS.MINIMUM_SLAB_THICKNESS; anything at or below this means reset.
 */
export const MIN_SLAB_THICKNESS: number =
  CONSTANTS?.RENDERING_DEFAULTS?.MINIMUM_SLAB_THICKNESS ?? 0.05;

/** Debounce applied to the slab slider so a drag issues one engine write, not one per frame. */
export const SLAB_COMMIT_DELAY_MS = 150;

/** Slider granularity in mm. */
export const SLAB_SLIDER_STEP = 1;

/** Hanging-protocol keyword resolving to the volume bounding diagonal. */
export const FULL_VOLUME_KEYWORD = 'fullVolume';
