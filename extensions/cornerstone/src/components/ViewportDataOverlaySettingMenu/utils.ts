import { utilities as csUtils } from '@cornerstonejs/core';

export const DEFAULT_COLORMAP = 'hsv';
export const DEFAULT_OPACITY = 0.5;
export const DEFAULT_OPACITY_PERCENT = DEFAULT_OPACITY * 100;
export const DERIVED_OVERLAY_MODALITIES = ['SEG', 'RTSTRUCT'];

/**
 * Get modality-specific color and opacity settings from the customization service
 */
export function getModalityOverlayColormap(customizationService, modality) {
  const modalityOverlayDefaultColorMaps = customizationService?.getCustomization(
    'cornerstone.modalityOverlayDefaultColorMaps'
  ) || { defaultSettings: {} };

  return (
    modalityOverlayDefaultColorMaps.defaultSettings[modality] || {
      colormap: DEFAULT_COLORMAP,
      opacity: DEFAULT_OPACITY,
    }
  );
}

/**
 * Identifies display sets that can be used as overlays for a specific viewport.
 *
 * "Enhanced" display sets are those that:
 * 1. Are not already in the viewport
 * 2. Are evaluated for their ability to be overlaid onto the background display set
 * 3. Have an "isOverlayable" flag indicating if they're compatible with the viewport
 *
 * A display set is considered overlayable when:
 * - The background display set is reconstructable
 * - The display set is not unsupported
 * - The Frame of Reference matches the background display set
 * - For non-derived modalities: background can be a volume and display set is either multiframe or valid volume
 *
 * @returns {Object} Object containing:
 *   - viewportDisplaySets: Display sets already in the viewport
 *   - enhancedDisplaySets: Other display sets with overlayability assessment
 */
export function getEnhancedDisplaySets({ viewportId, services }) {
  const { displaySetService, viewportGridService } = services;
  const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

  if (!displaySetsUIDs?.length) {
    return {
      viewportDisplaySets: [],
      enhancedDisplaySets: [],
    };
  }

  const allDisplaySets = displaySetService.getActiveDisplaySets();

  const otherDisplaySets = allDisplaySets.filter(
    displaySet => !displaySetsUIDs.includes(displaySet.displaySetInstanceUID)
  );

  const viewportDisplaySets = displaySetsUIDs.map(displaySetUID =>
    displaySetService.getDisplaySetByUID(displaySetUID)
  );

  const backgroundCanBeVolume = csUtils.isValidVolume(viewportDisplaySets[0].imageIds || []);
  const backgroundDisplaySet = viewportDisplaySets[0];

  const enhancedDisplaySets = otherDisplaySets.map(displaySet => {
    if (!backgroundDisplaySet.isReconstructable) {
      return {
        ...displaySet,
        isOverlayable: false,
      };
    }

    if (displaySet.unsupported) {
      return {
        ...displaySet,
        isOverlayable: false,
      };
    }

    // Check if Frame of Reference matches
    if (
      displaySet.FrameOfReferenceUID &&
      displaySet.FrameOfReferenceUID !== backgroundDisplaySet.FrameOfReferenceUID
    ) {
      return {
        ...displaySet,
        isOverlayable: false,
      };
    }

    // Special handling for derived modalities
    if (!DERIVED_OVERLAY_MODALITIES.includes(displaySet.Modality)) {
      if (!backgroundCanBeVolume) {
        return {
          ...displaySet,
          isOverlayable: false,
        };
      }

      const imageIds = displaySet.imageIds || displaySet.images?.map(image => image.imageId);
      const isMultiframe = displaySet.isMultiFrame;

      if (!isMultiframe && imageIds?.length > 0 && !csUtils.isValidVolume(imageIds)) {
        return {
          ...displaySet,
          isOverlayable: false,
        };
      }
    }

    return {
      ...displaySet,
      isOverlayable: true,
    };
  });

  return {
    viewportDisplaySets,
    enhancedDisplaySets,
  };
}

/**
 * Sort function: puts disabled items (isOverlayable: false) at the end
 */
export const sortByOverlayable = (a, b) => {
  if (a.isOverlayable === b.isOverlayable) {
    return 0;
  }
  return a.isOverlayable ? -1 : 1;
};

/**
 * Create display set options based on modality and opacity settings
 */
export function createColormapOverlayDisplaySetOptions(displaySet, opacity, customizationService) {
  if (displaySet.Modality === 'SEG') {
    return {};
  }

  const modalitySettings = getModalityOverlayColormap(customizationService, displaySet.Modality);
  return {
    colormap: {
      name: modalitySettings.colormap || DEFAULT_COLORMAP,
      opacity: opacity / 100, // Convert from percentage to 0-1 range
    },
  };
}

/**
 * Get segmentations that can be added as overlays to the viewport
 *
 * Note: This function is deprecated as we now use display sets for segmentations
 */
export function getAvailableSegmentations(segmentationService) {
  const segmentations = segmentationService.getSegmentations() || [];
  return segmentations.map(segmentation => ({
    segmentationId: segmentation.segmentationId,
    label: segmentation.label || 'Segmentation',
    segments: segmentation.segments,
    frameOfReferenceUID: segmentation.frameOfReferenceUID,
  }));
}
