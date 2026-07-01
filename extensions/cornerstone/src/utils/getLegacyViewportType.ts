import { Enums as csEnums, Types as csTypes, utilities as csUtils } from '@cornerstonejs/core';

const { ViewportType } = csEnums;

type ViewportLike = {
  requestedType?: csEnums.ViewportType;
  type?: csEnums.ViewportType;
};

/**
 * Returns the legacy/requested viewport type, transparent across GenericViewport
 * compatibility remapping.
 *
 * When `rendering.useGenericViewport` is enabled, a viewport requested as
 * `STACK` or `ORTHOGRAPHIC` has runtime `viewport.type === PLANAR_NEXT`, and a
 * `VOLUME_3D` request has `VOLUME_3D_NEXT`. The rendering engine records the
 * original request on `viewport.requestedType`, which this reads. Falls back to
 * `viewport.type` for legacy/non-remapped viewports (and older cornerstone builds
 * that do not populate `requestedType`).
 *
 * Use this instead of `viewport instanceof StackViewport/VolumeViewport/...` or
 * raw `viewport.type === ViewportType.X` when branching on the legacy viewport
 * type. For "does this viewport support operation X" questions, prefer the
 * cornerstone capability guards (`utilities.viewportSupports*`) instead.
 */
export function getLegacyViewportType(
  viewport: unknown
): csEnums.ViewportType | undefined {
  const vp = viewport as ViewportLike | null | undefined;
  return vp?.requestedType ?? vp?.type;
}

/** Legacy STACK viewport (image stack). Replaces `instanceof StackViewport`. */
export function isStackViewportType(
  viewport: unknown
): viewport is csTypes.IStackViewport {
  return getLegacyViewportType(viewport) === ViewportType.STACK;
}

/** Legacy ORTHOGRAPHIC (MPR) viewport. Replaces `instanceof VolumeViewport`. */
export function isOrthographicViewportType(
  viewport: unknown
): viewport is csTypes.IVolumeViewport {
  return getLegacyViewportType(viewport) === ViewportType.ORTHOGRAPHIC;
}

/** Legacy VOLUME_3D viewport. Replaces `instanceof VolumeViewport3D`. */
export function isVolume3DViewportType(
  viewport: unknown
): viewport is csTypes.IVolumeViewport {
  return getLegacyViewportType(viewport) === ViewportType.VOLUME_3D;
}

/**
 * Legacy ORTHOGRAPHIC or VOLUME_3D viewport (i.e. a `BaseVolumeViewport`).
 * Replaces `instanceof BaseVolumeViewport`.
 */
export function isVolumeViewportType(
  viewport: unknown
): viewport is csTypes.IVolumeViewport {
  const legacyType = getLegacyViewportType(viewport);
  return (
    legacyType === ViewportType.ORTHOGRAPHIC ||
    legacyType === ViewportType.VOLUME_3D
  );
}

/**
 * True for any viewport that renders volume content and therefore supports
 * volume-only appearance controls (threshold, per-layer opacity): a legacy
 * ORTHOGRAPHIC viewport, or a native ("next") generic viewport whose active
 * binding is a volume (`getCurrentMode() === 'volume'`).
 *
 * A native MPR/volume viewport runs as PLANAR_NEXT and reports `requestedType`
 * PLANAR_NEXT (not ORTHOGRAPHIC), so `isOrthographicViewportType` alone misses
 * it. Use this for "does this viewport support volume thresholding/opacity"
 * gates that must work across both backends.
 */
export function isVolumeRenderingViewport(viewport: unknown): boolean {
  if (isOrthographicViewportType(viewport)) {
    return true;
  }

  if (csUtils.isGenericViewport(viewport)) {
    const mode = (viewport as { getCurrentMode?: () => string }).getCurrentMode?.();
    return mode === 'volume';
  }

  return false;
}
