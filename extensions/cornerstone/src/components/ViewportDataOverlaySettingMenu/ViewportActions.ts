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
  cornerstoneViewportService,
  viewportId,
  customizationService,
}) {
  const currentOverlayUIDs = currentOverlays.map(overlay => overlay.displaySetInstanceUID);

  viewport.displaySetInstanceUIDs = [
    backgroundDisplaySet.displaySetInstanceUID,
    ...currentOverlayUIDs,
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
}) {
  const remainingOverlayUIDs = remainingOverlays.map(overlay => overlay.displaySetInstanceUID);

  viewport.displaySetInstanceUIDs = [
    backgroundDisplaySet.displaySetInstanceUID,
    ...remainingOverlayUIDs,
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
}) {
  const activeOverlayUIDs = activeOverlays.map(overlay => overlay.displaySetInstanceUID);

  viewport.displaySetInstanceUIDs = [
    newBackgroundDisplaySet.displaySetInstanceUID,
    ...activeOverlayUIDs,
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
