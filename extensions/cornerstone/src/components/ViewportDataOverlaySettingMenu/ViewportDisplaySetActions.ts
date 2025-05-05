import { createColormapOverlayDisplaySetOptions } from './utils';

// Todo: these are ohif viewport types which are different than cs3d enums
// and we should fix them to use cs3d enums. In cs3d we call volume -> orthographic
const AllowedViewportTypes = ['volume', 'stack'];

/**
 * Configures viewport for removing a foreground display set
 * @param viewport - The viewport to configure
 * @param displaySetUID - The display set UID to remove
 * @param viewportDisplaySetUIDs - Current display set UIDs in the viewport
 * @param servicesManager - The services manager
 * @returns boolean - Returns true if operation is supported for this viewport type, false otherwise
 */
export function configureViewportForForegroundRemoval({
  viewport,
  displaySetUID: displaySetUIDToRemove,
  viewportDisplaySetUIDs: currentDisplaySetUIDs,
  servicesManager,
}) {
  const { cornerstoneViewportService } = servicesManager.services;
  const { viewportId } = viewport;

  // Check if viewport type supports this operation
  const currentViewportType = viewport.viewportOptions?.viewportType;
  if (!AllowedViewportTypes.includes(currentViewportType)) {
    return false;
  }

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

  return true;
}

/**
 * Configure viewport for overlay addition
 * @param viewport - The viewport to configure
 * @param currentDisplaySetUIDs - Current display set UIDs in the viewport
 * @param servicesManager - The services manager
 * @returns boolean|object - Returns updated viewport if operation is supported, false otherwise
 */
export function configureViewportForForegroundAddition({
  viewport,
  currentDisplaySetUIDs,
  servicesManager,
}) {
  const { cornerstoneViewportService, displaySetService, customizationService } =
    servicesManager.services;

  const { viewportId } = viewport;

  // Check if viewport type supports this operation
  const currentViewportType = viewport.viewportOptions?.viewportType;
  if (!AllowedViewportTypes.includes(currentViewportType)) {
    return false;
  }

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
    return createColormapOverlayDisplaySetOptions(displaySet, 90, customizationService);
  });

  viewport.displaySetOptions = displaySetOptions;

  return viewport;
}

/**
 * Configure viewport for overlay removal
 * @param viewport - The viewport to configure
 * @param backgroundDisplaySet - The background display set
 * @param remainingOverlays - The overlays that remain after removal
 * @param overlayOpacities - Map of overlay UIDs to their opacity values
 * @param customizationService - The customization service
 * @param activeSegmentations - Active segmentations to include
 * @returns boolean|object - Returns updated viewport if operation is supported, false otherwise
 */
export function configureViewportForOverlayRemoval({
  viewport,
  backgroundDisplaySet,
  remainingOverlays,
  overlayOpacities,
  customizationService,
  activeSegmentations = [],
}) {
  // Check if viewport type supports this operation
  const currentViewportType = viewport.viewportOptions?.viewportType;
  if (!AllowedViewportTypes.includes(currentViewportType)) {
    return false;
  }

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
      createColormapOverlayDisplaySetOptions(overlay, opacity, customizationService)
    );
  });

  // Handle segmentation display sets if they exist
  activeSegmentations.forEach(segmentation => {
    if (segmentation.displaySetInstanceUID) {
      viewport.displaySetOptions.push(
        createColormapOverlayDisplaySetOptions(segmentation, 100, customizationService)
      );
    }
  });

  return viewport;
}

/**
 * Create viewport configuration for opacity update
 * @param viewportId - The ID of the viewport
 * @param backgroundDisplaySet - The background display set
 * @param displaySetUID - The display set UID to update opacity for
 * @param opacity - The new opacity value
 * @param overlay - The overlay display set
 * @param customizationService - The customization service
 * @param viewportType - The viewport type, defaults to 'volume'
 * @returns object|boolean - Returns config object if operation is supported, false otherwise
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
    displaySetOptions: [
      {},
      createColormapOverlayDisplaySetOptions(overlay, opacity, customizationService),
    ],
  };
}
