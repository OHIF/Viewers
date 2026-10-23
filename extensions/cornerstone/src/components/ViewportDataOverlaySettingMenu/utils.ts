import {
  DERIVED_OVERLAY_MODALITIES,
  isDisplaySetOverlayable,
} from '../../utils/isDisplaySetOverlayable';

export const DEFAULT_COLORMAP = 'hsv';
export const DEFAULT_OPACITY = 0.5;
export const DEFAULT_OPACITY_PERCENT = DEFAULT_OPACITY * 100;
export { DERIVED_OVERLAY_MODALITIES };

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
 * This is the viewport-driven caller of `isDisplaySetOverlayable`: it resolves
 * the viewport's background display set and applies the shared rule to every
 * other display set. The rule itself lives in utils/isDisplaySetOverlayable so
 * that hydration - which has no viewport to start from - can use it too.
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

  const backgroundDisplaySet = viewportDisplaySets[0];

  const enhancedDisplaySets = otherDisplaySets.map(displaySet => ({
    ...displaySet,
    isOverlayable: isDisplaySetOverlayable({ displaySet, backgroundDisplaySet }),
  }));

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
