import { ViewportData } from './types';
import { isVolume3DViewportType } from '../../../utils/getLegacyViewportType';
import { getViewportAdapter } from '../../../services/ViewportService/adapter';

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

  // A stack renders the full progress UI; an acquisition-plane volume is the
  // volume-mode equivalent. The adapter classifies both lanes (legacy by
  // viewport type / isInAcquisitionPlane; native by content mode + view-state
  // orientation, since PLANAR_NEXT collapses the runtime type).
  const adapter = getViewportAdapter(viewport);
  const shape = adapter.getShape();
  if (shape === 'stack') {
    return true;
  }
  if (shape === 'volume') {
    return adapter.isInAcquisitionPlane();
  }

  return false;
}

export function getImageIdFromCacheEvent(event): string | undefined {
  const detail = event?.detail;
  return detail?.imageId || detail?.image?.imageId || detail?.cachedImage?.imageId;
}
