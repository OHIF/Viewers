import type { Types } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';

const STACK = 'stack';
const VOLUME = 'volume';
const ORTHOGRAPHIC = 'orthographic';
const VOLUME_3D = 'volume3d';
const VIDEO = 'video';
const WHOLESLIDE = 'wholeslide';

export default function getCornerstoneViewportType(
  viewportType: string,
  displaySets?: Types.DisplaySet[]
): Enums.ViewportType {
  const lowerViewportType =
    displaySets?.[0]?.viewportType?.toLowerCase() || viewportType.toLowerCase();
  if (lowerViewportType === STACK) {
    return Enums.ViewportType.STACK;
  }

  if (lowerViewportType === VIDEO) {
    return Enums.ViewportType.VIDEO;
  }
  if (lowerViewportType === WHOLESLIDE) {
    return Enums.ViewportType.WHOLE_SLIDE;
  }

  if (lowerViewportType === VOLUME || lowerViewportType === ORTHOGRAPHIC) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  if (lowerViewportType === VOLUME_3D) {
    return Enums.ViewportType.VOLUME_3D;
  }

  throw new Error(
    `Invalid viewport type: ${viewportType}. Valid types are: stack, volume, video, wholeslide`
  );
}
