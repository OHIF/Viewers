import { createDisplaySetOptions } from './utils';

/**
 * Configure viewport for overlay addition
 */
export function configureViewportForForegroundAddition({
  viewport,
  currentDisplaySets,
  servicesManager,
}) {
  const { cornerstoneViewportService, displaySetService, customizationService } =
    servicesManager.services;

  const { viewportId } = viewport;

  // Set the display set UIDs for the viewport
  const foreGroundDisplaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
  const allDisplaySetInstanceUIDs = [...currentDisplaySets, foreGroundDisplaySetInstanceUID];
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
