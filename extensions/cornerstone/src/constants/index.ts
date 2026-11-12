import { Enums } from '@cornerstonejs/core';

// Volume loader schemes
export const VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
export const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';

/**
 * Viewport types that have no VOI range, so window/level cannot apply to them.
 */
export const UNSUPPORTED_WINDOW_LEVEL_VIEWPORT_TYPES: string[] = [
  Enums.ViewportType.ECG,
  Enums.ViewportType.ECG_NEXT,
];
