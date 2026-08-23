import type { Types } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import { isNextViewportsEnabled } from './nextViewports';

const STACK = 'stack';
const VOLUME = 'volume';
const ORTHOGRAPHIC = 'orthographic';
const VOLUME_3D = 'volume3d';
const VIDEO = 'video';
const WHOLESLIDE = 'wholeslide';
const ECG = 'ecg';

export default function getCornerstoneViewportType(
  viewportType: string,
  displaySets?: Types.DisplaySet[],
  useNextViewports = isNextViewportsEnabled()
): Enums.ViewportType {
  const lowerViewportType =
    displaySets?.[0]?.viewportType?.toLowerCase() || viewportType.toLowerCase();

  // Already a native Generic ("next") type — e.g. re-derived from a viewport's
  // stored cornerstone type (ViewportInfo.viewportType). Pass through
  // idempotently, exactly as the legacy types below map to themselves; this must
  // hold regardless of the flag so re-entrant callers don't throw.
  switch (lowerViewportType) {
    case 'planarnext':
      return Enums.ViewportType.PLANAR_NEXT;
    case 'volume3dnext':
      return Enums.ViewportType.VOLUME_3D_NEXT;
    case 'videonext':
      return Enums.ViewportType.VIDEO_NEXT;
    case 'wholeslidenext':
      return Enums.ViewportType.WHOLE_SLIDE_NEXT;
    case 'ecgnext':
      return Enums.ViewportType.ECG_NEXT;
  }

  // Native Generic Viewport ("next") path (appConfig.useNextViewports). Stack and
  // volume/orthographic both collapse to PLANAR_NEXT — the render path (image vs
  // volume slice) is inferred from the data shape, not from the viewport type.
  if (useNextViewports) {
    switch (lowerViewportType) {
      case STACK:
      case VOLUME:
      case ORTHOGRAPHIC:
        return Enums.ViewportType.PLANAR_NEXT;
      case VOLUME_3D:
        return Enums.ViewportType.VOLUME_3D_NEXT;
      case VIDEO:
        return Enums.ViewportType.VIDEO_NEXT;
      case WHOLESLIDE:
        return Enums.ViewportType.WHOLE_SLIDE_NEXT;
      case ECG:
        return Enums.ViewportType.ECG_NEXT;
      default:
        throw new Error(
          `Invalid viewport type: ${viewportType}. Valid types are: stack, volume, orthographic, volume3d, video, wholeslide, ecg`
        );
    }
  }

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
    `Invalid viewport type: ${viewportType}. Valid types are: stack, volume, orthographic, volume3d, video, wholeslide, ecg`
  );
}
