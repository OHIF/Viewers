import { Enums } from '@cornerstonejs/core';

const STACK = 'stack';
const VOLUME = 'volume';
const VOLUME_3D = 'volume3d';

export default function getCornerstoneViewportType(
  viewportType: string
): Enums.ViewportType {
  if (viewportType.toLowerCase() === STACK) {
    return Enums.ViewportType.STACK;
  }

  if (viewportType.toLowerCase() === VOLUME) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  if (viewportType.toLowerCase() === VOLUME_3D) {
    return Enums.ViewportType.VOLUME_3D;
  }

  throw new Error(
    `Invalid viewport type: ${viewportType}. Valid types are: stack, volume`
  );
}
