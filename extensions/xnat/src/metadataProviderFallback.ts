/**
 * Cornerstone metadata fallback provider for XNAT imageIds.
 * When the main OHIF metadata provider returns undefined (e.g. before instances
 * are loaded, or for imageIds with non-standard formats), this provider returns
 * minimal metadata so functions like isValidVolume don't crash on destructuring.
 */
import { metaData } from '@cornerstonejs/core';

const EMPTY_GENERAL_SERIES = {
  modality: 'OT',
  seriesInstanceUID: '',
  studyInstanceUID: '',
  seriesNumber: 0,
  seriesDescription: '',
  seriesDate: '',
  seriesTime: '',
};

/**
 * Register the XNAT metadata fallback provider.
 * Call this from XNAT init after cornerstone is ready.
 * Uses priority 10000 so it runs last when other providers return undefined.
 */
export function registerXnatMetadataFallback(): void {
  const fallbackProvider = (type: string, imageId: string): Record<string, unknown> | undefined => {
    if (typeof imageId !== 'string' || !imageId) {
      return undefined;
    }
    // Only provide fallback for generalSeriesModule - that's what isValidVolume needs
    if (type !== 'generalSeriesModule') {
      return undefined;
    }
    // Return minimal metadata to prevent "Cannot destructure property 'modality'" crash.
    // We're only invoked when prior providers returned undefined.
    return EMPTY_GENERAL_SERIES;
  };

  metaData.addProvider(fallbackProvider, 10000);
}
