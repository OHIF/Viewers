import { Enums } from '@cornerstonejs/core';

const STACK = 'stack';
const VOLUME = 'volume';

export default function getCornerstoneViewportType(
  viewportType: string
): Enums.ViewportType {
  if (viewportType.toLowerCase() === STACK) {
    return Enums.ViewportType.STACK;
  }

  if (viewportType.toLowerCase() === VOLUME) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  throw new Error(
    `Invalid viewport type: ${viewportType}. Valid types are: stack, volume`
  );
}
