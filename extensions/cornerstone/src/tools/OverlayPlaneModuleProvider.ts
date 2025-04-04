import { metaData } from '@cornerstonejs/core';

const _cachedOverlayMetadata: Map<string, any[]> = new Map();

/**
 * Image Overlay Viewer tool is not a traditional tool that requires user interactin.
 * But it is used to display Pixel Overlays. And it will provide toggling capability.
 *
 * The documentation for Overlay Plane Module of DICOM can be found in [C.9.2 of
 * Part-3 of DICOM standard](https://dicom.nema.org/medical/dicom/2018b/output/chtml/part03/sect_C.9.2.html)
 *
 * Image Overlay rendered by this tool can be toggled on and off using
 * toolGroup.setToolEnabled() and toolGroup.setToolDisabled()
 */
const OverlayPlaneModuleProvider = {
  /** Adds the metadata for overlayPlaneModule */
  add: (imageId, metadata) => {
    if (_cachedOverlayMetadata.get(imageId) === metadata) {
      // This is a no-op here as the tool re-caches the data
      return;
    }
    _cachedOverlayMetadata.set(imageId, metadata);
  },

  /** Standard getter for metadata */
  get: (type: string, query: string | string[]) => {
    if (Array.isArray(query)) {
      return;
    }
    if (type !== 'overlayPlaneModule') {
      return;
    }
    return _cachedOverlayMetadata.get(query);
  },
};

// Needs to be higher priority than default provider
metaData.addProvider(OverlayPlaneModuleProvider.get, 10_000);

export default OverlayPlaneModuleProvider;
