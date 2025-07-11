export const DERIVED_OVERLAY_MODALITIES = ['SEG', 'RTSTRUCT'];
export const DEFAULT_COLORMAP = 'hsv';
export const DEFAULT_OPACITY = 0.9;
export const DEFAULT_OPACITY_PERCENT = DEFAULT_OPACITY * 100;

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
 * Configure viewport for adding a display set layer
 */
export function configureViewportForLayerAddition(params: {
  viewport: any;
  displaySetInstanceUID: string;
  currentDisplaySetUIDs: string[];
  servicesManager: AppTypes.ServicesManager;
}): any {
  const { viewport, displaySetInstanceUID, currentDisplaySetUIDs, servicesManager } = params;
  const { cornerstoneViewportService, displaySetService, customizationService } =
    servicesManager.services;

  const { viewportId } = viewport;

  // Set the display set UIDs for the viewport
  const allDisplaySetInstanceUIDs = [...currentDisplaySetUIDs, displaySetInstanceUID];
  viewport.displaySetInstanceUIDs = allDisplaySetInstanceUIDs;

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }

  const requestedLayerDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  if (!viewport.viewportOptions.orientation) {
    viewport.viewportOptions.orientation = cornerstoneViewportService.getOrientation(viewportId);
  }

  // If a viewport type was already set do not reset it.
  if (!viewport.viewportOptions.viewportType) {
    // Special handling for overlay display sets
    if (requestedLayerDisplaySet.isOverlayDisplaySet) {
      // Do not force volume for SEG and RTSTRUCT if it and all the current display sets are for the same display set
      const isSameDisplaySet = currentDisplaySetUIDs.every(uid => {
        const currentDisplaySet = displaySetService.getDisplaySetByUID(uid);
        return currentDisplaySet.isOverlayDisplaySet
          ? currentDisplaySet.referencedDisplaySetInstanceUID ===
              requestedLayerDisplaySet.referencedDisplaySetInstanceUID
          : uid === requestedLayerDisplaySet.referencedDisplaySetInstanceUID;
      });
      if (isSameDisplaySet) {
        viewport.viewportOptions.viewportType = 'stack';
      } else {
        viewport.viewportOptions.viewportType = 'volume';
      }
    } else {
      viewport.viewportOptions.viewportType = 'volume';
    }
  }

  // create same amount of display set options as the number of display set UIDs
  const displaySetOptions = allDisplaySetInstanceUIDs.map((uid, index) => {
    // There is already a display set option for this display set, so return it.
    if (viewport.displaySetOptions?.[index]) {
      return viewport.displaySetOptions[index];
    }

    if (index === 0) {
      // no colormap for background
      return {};
    }

    const displaySet = displaySetService.getDisplaySetByUID(uid);
    return createColormapOverlayDisplaySetOptions(displaySet, 90, customizationService);
  });

  viewport.displaySetOptions = displaySetOptions;

  return viewport;
}

/**
 * Configure viewport for removing a display set layer
 */
export function configureViewportForLayerRemoval(params: {
  viewport: any;
  displaySetInstanceUID: string;
  currentDisplaySetUIDs: string[];
  servicesManager: AppTypes.ServicesManager;
}): any {
  const { viewport, displaySetInstanceUID, currentDisplaySetUIDs, servicesManager } = params;
  const { cornerstoneViewportService, displaySetService } = servicesManager.services;

  const { viewportId } = viewport;

  // Filter out the display set to remove
  viewport.displaySetInstanceUIDs = currentDisplaySetUIDs.filter(
    uid => uid !== displaySetInstanceUID
  );

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }

  viewport.viewportOptions.viewportType = 'volume';

  // orientation
  if (!viewport.viewportOptions.orientation) {
    viewport.viewportOptions.orientation = cornerstoneViewportService.getOrientation(viewportId);
  }

  // Recreate the display set options
  viewport.displaySetOptions = viewport.displaySetInstanceUIDs.map(() => {
    // For simplicity, we're returning empty options for now
    // In a more complete implementation, we would need to preserve existing display set options
    return {};
  });

  return viewport;
}

/**
 * Check if a display set can be added as a layer to the specified viewport
 */
export function canAddDisplaySetToViewport(params: {
  viewportId: string;
  displaySetInstanceUID: string;
  servicesManager: AppTypes.ServicesManager;
}): boolean {
  const { viewportId, displaySetInstanceUID, servicesManager } = params;
  const { displaySetService, viewportGridService } = servicesManager.services;

  // Check if the display set exists
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  if (!displaySet) {
    return false;
  }

  // Get current display sets in the viewport
  const currentDisplaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

  // Check if the display set is already in the viewport
  if (currentDisplaySetUIDs.includes(displaySetInstanceUID)) {
    return false;
  }

  return true;
}
