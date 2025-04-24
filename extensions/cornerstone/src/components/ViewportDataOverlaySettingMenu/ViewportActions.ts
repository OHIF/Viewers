import { createDisplaySetOptions } from './utils';

export function configureViewportForForegroundRemoval({
  viewport,
  displaySetUID: displaySetUIDToRemove,
  viewportDisplaySetUIDs: currentDisplaySetUIDs,
  servicesManager,
}) {
  const { cornerstoneViewportService } = servicesManager.services;

  const { viewportId } = viewport;

  viewport.displaySetInstanceUIDs = currentDisplaySetUIDs
    .map(displaySetUID => {
      if (displaySetUID !== displaySetUIDToRemove) {
        return displaySetUID;
      }

      return null;
    })
    .filter(Boolean);

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }

  viewport.viewportOptions.viewportType = 'volume';

  // orientation
  if (!viewport.viewportOptions.orientation) {
    viewport.viewportOptions.orientation = cornerstoneViewportService.getOrientation(viewportId);
  }

  // display set options
  viewport.displaySetOptions = viewport.displaySetInstanceUIDs.map(displaySetUID => {
    // Todo: We should check if the display set is in the foreground and preserve its opacity.
    // Maybe there were multiple foregrounds, and we should preserve their opacity.
    return {};
  });
}

/**
 * Configure viewport for overlay addition
 */
export function configureViewportForForegroundAddition({
  viewport,
  currentDisplaySetUIDs,
  servicesManager,
}) {
  const { cornerstoneViewportService, displaySetService, customizationService } =
    servicesManager.services;

  const { viewportId } = viewport;

  // Set the display set UIDs for the viewport
  const foreGroundDisplaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
  const allDisplaySetInstanceUIDs = [...currentDisplaySetUIDs, foreGroundDisplaySetInstanceUID];
  viewport.displaySetInstanceUIDs = allDisplaySetInstanceUIDs;

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }

  if (!viewport.viewportOptions.orientation) {
    viewport.viewportOptions.orientation = cornerstoneViewportService.getOrientation(viewportId);
  }

  viewport.viewportOptions.viewportType = 'volume';

  // create same amount of display set options as the number of display set UIDs
  const displaySetOptions = allDisplaySetInstanceUIDs.map((displaySetInstanceUID, index) => {
    if (index === 0) {
      // no colormap for background
      return {};
    }

    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    return createDisplaySetOptions(displaySet, 90, customizationService);
  });

  viewport.displaySetOptions = displaySetOptions;

  return viewport;
}

/**
 * Configure viewport for overlay removal
 */
export function configureViewportForOverlayRemoval({
  viewport,
  backgroundDisplaySet,
  remainingOverlays,
  overlayOpacities,
  customizationService,
  activeSegmentations = [],
}) {
  const remainingOverlayUIDs = remainingOverlays.map(overlay => overlay.displaySetInstanceUID);

  // Store any existing segmentation display sets
  const segmentationDisplaySetUIDs = activeSegmentations
    .filter(seg => seg.displaySetInstanceUID)
    .map(seg => seg.displaySetInstanceUID);

  viewport.displaySetInstanceUIDs = [
    backgroundDisplaySet.displaySetInstanceUID,
    ...remainingOverlayUIDs,
    ...segmentationDisplaySetUIDs,
  ];

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }
  viewport.viewportOptions.viewportType = 'volume';
  viewport.displaySetOptions = [{}];

  remainingOverlays.forEach(overlay => {
    const opacity = overlayOpacities[overlay.displaySetInstanceUID] || 90;
    viewport.displaySetOptions.push(
      createDisplaySetOptions(overlay, opacity, customizationService)
    );
  });

  // Handle segmentation display sets if they exist
  activeSegmentations.forEach(segmentation => {
    if (segmentation.displaySetInstanceUID) {
      viewport.displaySetOptions.push(
        createDisplaySetOptions(segmentation, 100, customizationService)
      );
    }
  });

  return viewport;
}

/**
 * Create viewport configuration for opacity update
 */
export function createViewportConfigForOpacityUpdate({
  viewportId,
  backgroundDisplaySet,
  displaySetUID,
  opacity,
  overlay,
  customizationService,
}) {
  return {
    viewportId,
    displaySetInstanceUIDs: [backgroundDisplaySet.displaySetInstanceUID, displaySetUID],
    viewportOptions: {
      viewportType: 'volume',
    },
    displaySetOptions: [{}, createDisplaySetOptions(overlay, opacity, customizationService)],
  };
}
