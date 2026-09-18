import { Enums as csEnums, Types as csTypes } from '@cornerstonejs/core';

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
export function getLegacyViewportType(viewport: unknown): csEnums.ViewportType | undefined {
  const vp = viewport as ViewportLike | null | undefined;
  return vp?.requestedType ?? vp?.type;
}

/** Legacy STACK viewport (image stack). Replaces `instanceof StackViewport`. */
export function isStackViewportType(viewport: unknown): viewport is csTypes.IStackViewport {
  return getLegacyViewportType(viewport) === ViewportType.STACK;
}

/** Legacy ORTHOGRAPHIC (MPR) viewport. Replaces `instanceof VolumeViewport`. */
export function isOrthographicViewportType(viewport: unknown): viewport is csTypes.IVolumeViewport {
  return getLegacyViewportType(viewport) === ViewportType.ORTHOGRAPHIC;
}

/**
 * 3D volume viewport. Replaces `instanceof VolumeViewport3D`.
 *
 * Matches both the legacy `VOLUME_3D` type and the native ("next") `VOLUME_3D_NEXT`.
 * Under `useNextViewports`, OHIF requests `VOLUME_3D_NEXT` directly, so cornerstone
 * leaves `requestedType` unset and `getLegacyViewportType` returns the native type
 * (cornerstone only rewrites `requestedType` back to the legacy type for its own
 * compat remap of a legacy `VOLUME_3D` request). Checking only `VOLUME_3D` would miss
 * native 3D viewports and misroute them through the planar (getViewReference/getViewState)
 * branch, and would leave 3D gates such as `is3DVolume` false.
 */
export function isVolume3DViewportType(viewport: unknown): viewport is csTypes.IVolumeViewport {
  const legacyType = getLegacyViewportType(viewport);
  return legacyType === ViewportType.VOLUME_3D || legacyType === ViewportType.VOLUME_3D_NEXT;
}

/**
 * Legacy ORTHOGRAPHIC or VOLUME_3D viewport (i.e. a `BaseVolumeViewport`).
 * Replaces `instanceof BaseVolumeViewport`.
 */
export function isVolumeViewportType(viewport: unknown): viewport is csTypes.IVolumeViewport {
  const legacyType = getLegacyViewportType(viewport);
  return legacyType === ViewportType.ORTHOGRAPHIC || legacyType === ViewportType.VOLUME_3D;
}
