import { createDisplaySetOptions } from './utils';

/**
 * Configure viewport for overlay addition
 */
export function configureViewportForOverlayAddition({
  viewport,
  backgroundDisplaySet,
  currentOverlays,
  newDisplaySet,
  overlayOpacities,
  servicesManager,
  activeSegmentations = [],
}) {
  const { cornerstoneViewportService, displaySetService, customizationService } =
    servicesManager.services;
  const { viewportId } = viewport;
  const currentOverlayUIDs = currentOverlays.map(overlay => overlay.displaySetInstanceUID);

  // Store any existing segmentation display sets
  const segmentationDisplaySetUIDs = activeSegmentations
    .filter(seg => seg.displaySetInstanceUID)
    .map(seg => seg.displaySetInstanceUID);

  viewport.displaySetInstanceUIDs = [
    backgroundDisplaySet.displaySetInstanceUID,
    ...currentOverlayUIDs,
    ...segmentationDisplaySetUIDs,
    newDisplaySet.displaySetInstanceUID,
  ];

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }

  if (!viewport.viewportOptions.orientation) {
    viewport.viewportOptions.orientation = cornerstoneViewportService.getOrientation(viewportId);
  }

  viewport.viewportOptions.viewportType = 'volume';

  viewport.displaySetOptions = [];

  viewport.displaySetOptions.push({});

  currentOverlays.forEach(overlay => {
    const opacity = overlayOpacities[overlay.displaySetInstanceUID] || 90;
    viewport.displaySetOptions.push(
      createDisplaySetOptions(overlay, opacity, customizationService)
    );
  });

  // Handle segmentation display sets if they exist
  activeSegmentations.forEach(segmentation => {
    const segDisplaySet = displaySetService.getDisplaySetByUID(segmentation.segmentationId);
    if (segDisplaySet) {
      viewport.displaySetOptions.push(
        createDisplaySetOptions(segDisplaySet, 100, customizationService)
      );
    }
  });

  viewport.displaySetOptions.push(createDisplaySetOptions(newDisplaySet, 90, customizationService));

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
 * Configure viewport for background change
 */
export function configureViewportForBackgroundChange({
  viewport,
  newBackgroundDisplaySet,
  activeOverlays,
  overlayOpacities,
  customizationService,
  activeSegmentations = [],
}) {
  const activeOverlayUIDs = activeOverlays.map(overlay => overlay.displaySetInstanceUID);

  // Store any existing segmentation display sets
  const segmentationDisplaySetUIDs = activeSegmentations
    .filter(seg => seg.displaySetInstanceUID)
    .map(seg => seg.displaySetInstanceUID);

  viewport.displaySetInstanceUIDs = [
    newBackgroundDisplaySet.displaySetInstanceUID,
    ...activeOverlayUIDs,
    ...segmentationDisplaySetUIDs,
  ];

  if (!viewport.viewportOptions) {
    viewport.viewportOptions = {};
  }
  viewport.viewportOptions.viewportType = 'volume';

  viewport.displaySetOptions = [];

  viewport.displaySetOptions.push({});

  activeOverlays.forEach(overlay => {
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
