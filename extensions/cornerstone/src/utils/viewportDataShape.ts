import { Enums } from '@cornerstonejs/core';

/**
 * Pre-mount classification of a viewport's bound data (viewportData from
 * CornerstoneCacheService), for code that runs before — or independently of —
 * a live viewport instance (overlays, scrollbars). Native ("next") viewports
 * collapse stack/volume onto a single PLANAR_NEXT viewportType, so these
 * helpers classify by the persisted dataShapeType and the data shape itself
 * (imageIds = stack, volume/volumeId = volume) instead of the runtime type.
 *
 * For classification of a LIVE viewport instance, use
 * `getViewportAdapter(viewport).getShape()` instead.
 */

type ViewportDatum = {
  imageIds?: string[];
  volume?: unknown;
  volumeId?: string;
  [key: string]: unknown;
};

type ViewportDataLike = {
  viewportType?: Enums.ViewportType;
  dataShapeType?: Enums.ViewportType;
  data?: ViewportDatum | ViewportDatum[];
};

/** The primary (non-overlay) datum of a viewportData. */
export function getPrimaryViewportDatum(viewportData: ViewportDataLike): ViewportDatum | undefined {
  return Array.isArray(viewportData?.data) ? viewportData.data[0] : viewportData?.data;
}

/** True when the primary datum is volume-shaped (volume/volumeId present). */
export function isVolumeViewportData(viewportData: ViewportDataLike): boolean {
  const firstData = getPrimaryViewportDatum(viewportData);
  return !!(firstData && (firstData.volume || firstData.volumeId));
}

/**
 * The stack/volume shape a viewportData was built for, transparent across the
 * native type collapse: the persisted dataShapeType when present (set by
 * CornerstoneCacheService on the native path), else the legacy viewportType.
 */
export function getViewportDataShapeType(
  viewportData: ViewportDataLike
): Enums.ViewportType | undefined {
  return viewportData?.dataShapeType ?? viewportData?.viewportType;
}

/**
 * The slice-navigation event for this viewport's content. Resolved from the
 * legacy viewportType when it is meaningful, else from the bound data shape —
 * which is known immediately, unlike a runtime content-mode check that may not
 * be ready while a native viewport is still binding. Native viewports emit the
 * same STACK_NEW_IMAGE / VOLUME_NEW_IMAGE events as legacy.
 */
export function getSliceEventName(viewportData: ViewportDataLike): string {
  const { viewportType } = viewportData;
  const firstData = getPrimaryViewportDatum(viewportData);
  return (
    (viewportType === Enums.ViewportType.STACK && Enums.Events.STACK_NEW_IMAGE) ||
    (viewportType === Enums.ViewportType.ORTHOGRAPHIC && Enums.Events.VOLUME_NEW_IMAGE) ||
    (isVolumeViewportData(viewportData) && Enums.Events.VOLUME_NEW_IMAGE) ||
    (firstData?.imageIds && Enums.Events.STACK_NEW_IMAGE) ||
    Enums.Events.IMAGE_RENDERED
  );
}

/**
 * The slice count for a viewport. `viewport.getNumberOfSlices()` can be
 * premature while a native viewport is still binding its data (it returns 1
 * until then). For an image stack the count is known from the bound data, so
 * prefer that and only fall back to the viewport for volume/MPR (where the
 * count depends on orientation).
 */
export function getViewportSliceCount(
  viewportData: ViewportDataLike,
  viewport: { getNumberOfSlices: () => number }
): number {
  const firstData = getPrimaryViewportDatum(viewportData);
  return (
    (!isVolumeViewportData(viewportData) && firstData?.imageIds?.length) ||
    viewport.getNumberOfSlices()
  );
}
