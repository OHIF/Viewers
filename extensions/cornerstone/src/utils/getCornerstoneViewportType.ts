import type { Types } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';

const STACK = 'stack';
const VOLUME = 'volume';
const ORTHOGRAPHIC = 'orthographic';
const VOLUME_3D = 'volume3d';
const VIDEO = 'video';
const WHOLESLIDE = 'wholeslide';
const ECG = 'ecg';

export default function getCornerstoneViewportType(
  viewportType: string,
  displaySets?: Types.DisplaySet[]
): Enums.ViewportType {
  // Overlays (SEG, RTSTRUCT, …) must not drive viewport classification; otherwise
  // `displaySets: [SEG, CT]` picks stack/SEG handling and MPR orientations collapse.
  const primaryDisplaySet =
    displaySets?.find(ds => ds && !ds.isOverlayDisplaySet) ?? displaySets?.[0];

  const lowerViewportType =
    primaryDisplaySet?.viewportType?.toLowerCase() || viewportType.toLowerCase();
  if (lowerViewportType === STACK) {
    return Enums.ViewportType.STACK;
  }

  if (lowerViewportType === VIDEO) {
    return Enums.ViewportType.VIDEO;
  }
  if (lowerViewportType === WHOLESLIDE) {
    return Enums.ViewportType.WHOLE_SLIDE;
  }

  if (lowerViewportType === ECG) {
    return Enums.ViewportType.ECG;
  }

  if (lowerViewportType === VOLUME || lowerViewportType === ORTHOGRAPHIC) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  if (lowerViewportType === VOLUME_3D) {
    return Enums.ViewportType.VOLUME_3D;
  }

  throw new Error(
    `Invalid viewport type: ${viewportType}. Valid types are: stack, volume, video, wholeslide, ecg`
  );
}
