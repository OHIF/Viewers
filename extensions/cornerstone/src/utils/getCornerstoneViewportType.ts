import { Enums } from '@cornerstonejs/core';

const STACK = 'stack';
const VOLUME = 'volume';
const ORTHOGRAPHIC = 'orthographic';
const VOLUME_3D = 'volume3d';

export default function getCornerstoneViewportType(viewportType: string): Enums.ViewportType {
  const lowerViewportType = viewportType.toLowerCase();
  if (lowerViewportType === STACK) {
    return Enums.ViewportType.STACK;
  }

  if (lowerViewportType === VOLUME || lowerViewportType === ORTHOGRAPHIC) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  if (lowerViewportType === VOLUME_3D) {
    return Enums.ViewportType.VOLUME_3D;
  }

  throw new Error(`Invalid viewport type: ${viewportType}. Valid types are: stack, volume`);
}
