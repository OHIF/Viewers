import { utilities as csUtils } from '@cornerstonejs/core';

export const DEFAULT_COLORMAP = 'HSV';
export const DEFAULT_OPACITY = 0.9;
export const DEFAULT_OPACITY_PERCENT = DEFAULT_OPACITY * 100;
export const DERIVED_OVERLAY_MODALITIES = ['SEG', 'RTSTRUCT', 'SR'];

/**
 * Get modality-specific color and opacity settings from the customization service
 */
export function getModalitySettings(customizationService, modality) {
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
 * Determine if display sets can be used as overlays
 */
export function getEnhancedDisplaySets({ viewportId, services }) {
  const { displaySetService, viewportGridService } = services;
  const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
  const allDisplaySets = displaySetService.getActiveDisplaySets();

  const otherDisplaySets = allDisplaySets.filter(
    displaySet => !displaySetsUIDs.includes(displaySet.displaySetInstanceUID)
  );

  const viewportDisplaySets = displaySetsUIDs.map(displaySetUID =>
    displaySetService.getDisplaySetByUID(displaySetUID)
  );

  const backgroundDisplaySet = viewportDisplaySets[0];
  const backGroundCanBeVolume = csUtils.isValidVolume(viewportDisplaySets[0].imageIds);

  const enhancedDisplaySets = otherDisplaySets.map(displaySet => {
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
      if (!backGroundCanBeVolume) {
        return {
          ...displaySet,
          isOverlayable: false,
        };
      }

      const imageIds = displaySet.imageIds || displaySet.images?.map(image => image.imageId);
      const isMultiframe = displaySet.isMultiFrame;

      if (!isMultiframe && imageIds.length > 0 && !csUtils.isValidVolume(imageIds)) {
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
    backgroundDisplaySet,
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
export function createDisplaySetOptions(displaySet, opacity, customizationService) {
  if (displaySet.Modality === 'SEG') {
    return {};
  }

  const modalitySettings = getModalitySettings(customizationService, displaySet.Modality);
  return {
    colormap: {
      name: modalitySettings.colormap || DEFAULT_COLORMAP,
      opacity: opacity / 100, // Convert from percentage to 0-1 range
    },
  };
}
