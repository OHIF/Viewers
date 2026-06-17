import { utilities as csUtils } from '@cornerstonejs/core';

type GenericNextViewport = {
  getSourceDataId?: () => string | undefined;
  getDisplaySetPresentation?: (dataId: string) => Record<string, unknown> | undefined;
  getViewState?: () => Record<string, unknown> | undefined;
};

type LegacyViewport = {
  getProperties?: (dataId?: string) => Record<string, unknown> | undefined;
  getCamera?: () => Record<string, unknown> | undefined;
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
    return (id ? vp.getDisplaySetPresentation?.(id) : undefined) ?? {};
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
