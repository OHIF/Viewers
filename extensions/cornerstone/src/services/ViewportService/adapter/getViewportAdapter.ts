import { utilities as csUtils, Types as CoreTypes } from '@cornerstonejs/core';
import type { IViewportAdapter } from './IViewportAdapter';
import { LegacyViewportAdapter } from './LegacyViewportAdapter';
import { NextViewportAdapter } from './NextViewportAdapter';

const adapterCache = new WeakMap<object, IViewportAdapter>();

/**
 * Resolves the IViewportAdapter for a cornerstone viewport. This is THE ONE
 * place (outside the segmentation backend family) allowed to call
 * `csUtils.isGenericViewport` — all other code must consume the adapter (or
 * the `isNextViewport` predicate below) instead of branching on the raw
 * viewport surface. Enforced by scripts/check-next-viewport-boundaries.sh.
 *
 * Adapters are stateless wrappers over the viewport, cached per viewport
 * instance, so calling this in render paths is cheap.
 */
export function getViewportAdapter(viewport: unknown): IViewportAdapter {
  if (!viewport || typeof viewport !== 'object') {
    throw new Error('getViewportAdapter: a viewport instance is required');
  }
  let adapter = adapterCache.get(viewport);
  if (!adapter) {
    adapter = csUtils.isGenericViewport(viewport)
      ? new NextViewportAdapter(viewport as ConstructorParameters<typeof NextViewportAdapter>[0])
      : new LegacyViewportAdapter(
          viewport as ConstructorParameters<typeof LegacyViewportAdapter>[0]
        );
    adapterCache.set(viewport, adapter);
  }
  return adapter;
}

/**
 * The per-viewport lane predicate, for the few dispatchers (viewport
 * operations, segmentation backend) that hold their own per-lane
 * implementations. Everyone else should call adapter methods instead of
 * branching on this.
 */
export function isNextViewport(viewport: unknown): boolean {
  return csUtils.isGenericViewport(viewport);
}

/**
 * True for any viewport that renders volume content and therefore supports
 * volume-only appearance controls (threshold, per-layer opacity): a legacy
 * ORTHOGRAPHIC viewport, or a native ("next") viewport whose active binding is
 * a volume. A native MPR/volume viewport runs as PLANAR_NEXT (not
 * ORTHOGRAPHIC), so legacy type guards alone miss it.
 */
export function isVolumeRenderingViewport(viewport: unknown): boolean {
  return !!viewport && getViewportAdapter(viewport).isVolumeRendering();
}

/**
 * World-space focal point (current slice center) for any viewport. Exposed as
 * a free function because it is part of the extension's public API (consumed
 * by tmtv).
 */
export function getViewportFocalPoint(viewport: unknown): CoreTypes.Point3 | undefined {
  return viewport ? getViewportAdapter(viewport).getFocalPoint() : undefined;
}
