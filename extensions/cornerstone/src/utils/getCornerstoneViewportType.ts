import { Enums } from '@cornerstonejs/core';

const STACK = 'stack';
const VOLUME = 'volume';
const ORTHOGRAPHIC = 'orthographic';

export default function getCornerstoneViewportType(
  viewportType: string
): Enums.ViewportType {
  const lowerViewportType = viewportType.toLowerCase();
  if (lowerViewportType === STACK) {
    return Enums.ViewportType.STACK;
  }

  if (lowerViewportType === VOLUME || lowerViewportType === ORTHOGRAPHIC) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  throw new Error(
    `Invalid viewport type: ${viewportType}. Valid types are: stack, volume`
  );
}
