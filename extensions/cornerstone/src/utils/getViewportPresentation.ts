import { utilities as csUtils, Types as CoreTypes } from '@cornerstonejs/core';

type VOIRange = { lower: number; upper: number };

type GenericNextViewport = {
  getSourceDataId?: () => string | undefined;
  getDisplaySetPresentation?: (dataId: string) => Record<string, unknown> | undefined;
  getDefaultVOIRange?: (dataId?: string) => VOIRange | undefined;
  setDisplaySetPresentation?: {
    (props: Record<string, unknown>): void;
    (dataId: string, props: Record<string, unknown>): void;
  };
  getViewState?: () => Record<string, unknown> | undefined;
  setViewState?: (patch: Record<string, unknown>) => void;
};

const voiRangesClose = (a: VOIRange, b: VOIRange, eps = 0.001): boolean =>
  Math.abs(a.lower - b.lower) < eps && Math.abs(a.upper - b.upper) < eps;

type LegacyViewport = {
  getProperties?: (dataId?: string) => Record<string, unknown> | undefined;
  setProperties?: (props: Record<string, unknown>, dataId?: string) => void;
  getCamera?: () => Record<string, unknown> | undefined;
  setCamera?: (patch: Record<string, unknown>) => void;
};

/**
 * Reads per-display-set appearance (voiRange, colormap, invert, ...) in a way
 * that works for both legacy and direct Generic ("next") viewports.
 *
 * Legacy viewports expose `getProperties()`; direct PLANAR_NEXT viewports expose
 * the per-binding `getDisplaySetPresentation(dataId)` instead (legacy property
 * methods are absent and throw). This bridges the two so presentation readers
 * (overlays, toolbar evaluators, colorbar, window-level) do not need to branch.
 *
 * @param viewport - any cornerstone viewport
 * @param dataId - display set id to read; defaults to the active source binding
 */
export function getViewportProperties(
  viewport: unknown,
  dataId?: string
): Record<string, unknown> {
  if (csUtils.isGenericViewport(viewport)) {
    const vp = viewport as unknown as GenericNextViewport;
    const id = dataId ?? vp.getSourceDataId?.();
    const presentation = (id ? vp.getDisplaySetPresentation?.(id) : undefined) ?? {};

    // A native binding's presentation normally holds only EXPLICIT VOI overrides,
    // but a computed default VOI can transiently land here during intermediate
    // mounts (e.g. while a SEG hydrates, the base image briefly mounts as a volume
    // and its min/max default is stored). Flag such a VOI as computed when it
    // matches the binding's default so the LUT-presentation capture (cleanProperties)
    // strips it instead of persisting+restoring it over the real default — matching
    // legacy StackViewport's isComputedVOI. Stamping is harmless even on a genuine
    // user VOI that happens to equal the default (stripping it falls back to the
    // same value).
    const voiRange = presentation.voiRange as VOIRange | undefined;
    if (voiRange && presentation.isComputedVOI === undefined) {
      const defaultVOIRange = vp.getDefaultVOIRange?.(id);
      if (defaultVOIRange && voiRangesClose(voiRange, defaultVOIRange)) {
        return { ...presentation, isComputedVOI: true };
      }
    }

    return presentation;
  }

  const legacy = viewport as LegacyViewport;
  return (dataId ? legacy.getProperties?.(dataId) : legacy.getProperties?.()) ?? {};
}

/**
 * Reads view-level state (rotation, flipHorizontal/Vertical, ...) for both
 * legacy and Generic ("next") viewports. Legacy viewports expose this through
 * `getCamera()`; direct Generic viewports expose semantic `getViewState()`
 * (no `getCamera`). Returns an empty object when neither is available.
 */
export function getViewportCameraState(viewport: unknown): Record<string, unknown> {
  if (csUtils.isGenericViewport(viewport)) {
    return (viewport as unknown as GenericNextViewport).getViewState?.() ?? {};
  }

  return (viewport as LegacyViewport).getCamera?.() ?? {};
}

/**
 * Writes per-display-set appearance (voiRange, colormap, invert, ...) in a way
 * that works for both legacy and direct Generic ("next") viewports.
 *
 * Legacy viewports expose `setProperties(props[, volumeId])`; direct PLANAR_NEXT
 * viewports expose `setDisplaySetPresentation([dataId,] props)` instead (legacy
 * property setters are absent and throw). This bridges the two so presentation
 * writers (invert, window-level, colormap) do not need to branch.
 *
 * @param viewport - any cornerstone viewport
 * @param props - the appearance props to apply
 * @param dataId - display set / volume id to target; defaults to the active binding
 */
export function setViewportProperties(
  viewport: unknown,
  props: Record<string, unknown>,
  dataId?: string
): void {
  if (csUtils.isGenericViewport(viewport)) {
    const vp = viewport as unknown as GenericNextViewport;
    const id = dataId ?? vp.getSourceDataId?.();
    if (id) {
      vp.setDisplaySetPresentation?.(id, props);
    } else {
      vp.setDisplaySetPresentation?.(props);
    }
    return;
  }

  (viewport as LegacyViewport).setProperties?.(props, dataId);
}

/**
 * Writes view-level state (rotation, flipHorizontal/Vertical, ...) for both
 * legacy and Generic ("next") viewports. Legacy viewports apply this through
 * `setCamera()`; direct Generic viewports apply a semantic `setViewState()`
 * patch (no `setCamera`). The patch is partial — unspecified fields are
 * preserved by the native viewport's merge.
 */
export function setViewportCameraState(
  viewport: unknown,
  patch: Record<string, unknown>
): void {
  if (csUtils.isGenericViewport(viewport)) {
    (viewport as unknown as GenericNextViewport).setViewState?.(patch);
    return;
  }

  (viewport as LegacyViewport).setCamera?.(patch);
}

/**
 * Reads the world-space focal point (the current slice center) for both legacy and
 * Generic ("next") viewports. Legacy viewports expose it via `getCamera().focalPoint`;
 * direct Generic viewports have no `getCamera`, and their view state carries no
 * `focalPoint`, so it comes from the view reference (`getViewReference().cameraFocalPoint`).
 * Returns undefined when neither is available.
 */
export function getViewportFocalPoint(viewport: unknown): CoreTypes.Point3 | undefined {
  if (csUtils.isGenericViewport(viewport)) {
    const ref = (
      viewport as unknown as {
        getViewReference?: () => { cameraFocalPoint?: CoreTypes.Point3 } | undefined;
      }
    ).getViewReference?.();
    return ref?.cameraFocalPoint;
  }

  return (viewport as LegacyViewport).getCamera?.()?.focalPoint as CoreTypes.Point3 | undefined;
}
