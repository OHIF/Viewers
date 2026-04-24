import { Enums, VolumeViewport3D } from '@cornerstonejs/core';
import { ViewportData } from './types';

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
  if (!viewportData || !viewport || viewport instanceof VolumeViewport3D) {
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
