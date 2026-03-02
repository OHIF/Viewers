/**
 * Cornerstone metadata fallback provider for XNAT imageIds.
 * When the main OHIF metadata provider returns undefined (e.g. before instances
 * are loaded, or for imageIds with non-standard formats), this provider returns
 * minimal metadata so functions like makeVolumeMetadata and isValidVolume don't
 * crash on destructuring.
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

/** Minimal imagePixelModule to prevent "Cannot destructure property 'pixelRepresentation'" in makeVolumeMetadata */
const EMPTY_IMAGE_PIXEL_MODULE = {
  pixelRepresentation: 0,
  bitsAllocated: 16,
  bitsStored: 16,
  highBit: 15,
  photometricInterpretation: 'MONOCHROME2',
  samplesPerPixel: 1,
};

/** Minimal imagePlaneModule for makeVolumeMetadata & spacing (orientation, spacing, dimensions) */
const EMPTY_IMAGE_PLANE_MODULE = {
  imageOrientationPatient: [1, 0, 0, 0, 1, 0] as [number, number, number, number, number, number],
  pixelSpacing: [1, 1] as [number, number],
  imagePositionPatient: [0, 0, 0] as [number, number, number],
  frameOfReferenceUID: '',
  columns: 512,
  rows: 512,
};

const FALLBACK_MAP: Record<string, Record<string, unknown>> = {
  generalSeriesModule: EMPTY_GENERAL_SERIES,
  imagePixelModule: EMPTY_IMAGE_PIXEL_MODULE,
  imagePlaneModule: EMPTY_IMAGE_PLANE_MODULE,
};

/**
 * Register the XNAT metadata fallback provider.
 * Call this from XNAT init after cornerstone is ready.
 * Uses priority -10000 (low) so it runs last when other providers return undefined.
 */
export function registerXnatMetadataFallback(): void {
  const fallbackProvider = (type: string, imageId: string): Record<string, unknown> | undefined => {
    if (typeof imageId !== 'string' || !imageId) {
      return undefined;
    }
    const fallback = FALLBACK_MAP[type];
    if (!fallback) {
      return undefined;
    }
    // Return minimal metadata to prevent destructuring crashes.
    // We're only invoked when prior providers returned undefined.
    return fallback;
  };

  metaData.addProvider(fallbackProvider, -10000);
}
