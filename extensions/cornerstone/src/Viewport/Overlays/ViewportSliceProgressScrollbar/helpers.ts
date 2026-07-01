import { Enums, utilities as csUtils } from '@cornerstonejs/core';
import { ViewportData } from './types';
import { isVolume3DViewportType } from '../../../utils/getLegacyViewportType';

export function getImageIndexFromEvent(event): number | undefined {
  const { imageIndex, newImageIdIndex = imageIndex, imageIdIndex } = event.detail;
  return newImageIdIndex ?? imageIdIndex;
}

export function getViewportImageIds(viewportData: ViewportData): string[] {
  if (!viewportData?.data?.length) {
    return [];
  }

  const firstData = viewportData.data[0];
  const volumeImageIds = (firstData as any).volume?.imageIds as string[] | undefined;
  const datumImageIds = (firstData as any).imageIds as string[] | undefined;

  return volumeImageIds || datumImageIds || [];
}

export function isProgressFullMode(viewportData: ViewportData, viewport): boolean {
  if (!viewportData || !viewport || isVolume3DViewportType(viewport)) {
    return false;
  }

  // Native Generic ("next") viewports report viewportData.viewportType === PLANAR_NEXT
  // (CornerstoneCacheService collapses stack/volume/orthographic to PLANAR_NEXT) and do
  // not implement isInAcquisitionPlane. Classify by content mode + view-state orientation
  // instead of the legacy viewportType.
  if (csUtils.isGenericViewport(viewport)) {
    const mode = viewport.getCurrentMode?.(); // 'stack' | 'volume' | 'empty' | 'unknown'
    if (mode === 'stack') {
      return true;
    }
    if (mode === 'volume') {
      // acquisition-plane volume == full mode (native equivalent of legacy
      // isInAcquisitionPlane). orientation defaults to ACQUISITION when unset.
      const orientation = viewport.getViewState?.()?.orientation;
      return orientation === Enums.OrientationAxis.ACQUISITION || orientation == null;
    }
    return false;
  }

  if (viewportData.viewportType === Enums.ViewportType.STACK) {
    return true;
  }

  if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
    return !!viewport.isInAcquisitionPlane?.();
  }

  return false;
}

export function getImageIdFromCacheEvent(event): string | undefined {
  const detail = event?.detail;
  return detail?.imageId || detail?.image?.imageId || detail?.cachedImage?.imageId;
}
