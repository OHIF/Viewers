const IMAGE_SLICE_SYNC_NAME = 'IMAGE_SLICE_SYNC';

export default function toggleImageSliceSync({
  toggledState,
  servicesManager,
  viewports: providedViewports,
}) {
  if (!toggledState) {
    return disableSync(IMAGE_SLICE_SYNC_NAME, servicesManager);
  }

  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  const viewports =
    providedViewports || getReconstructableStackViewports(viewportGridService, displaySetService);

  // create synchronization group and add the viewports to it.
  viewports.forEach(gridViewport => {
    const { viewportId } = gridViewport.viewportOptions;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!viewport) {
      return;
    }
    syncGroupService.addViewportToSyncGroup(viewportId, viewport.getRenderingEngine().id, {
      type: 'stackimage',
      id: IMAGE_SLICE_SYNC_NAME,
      source: true,
      target: true,
    });
  });
}

function disableSync(syncName, servicesManager) {
  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;
  const viewports = getReconstructableStackViewports(viewportGridService, displaySetService);
  viewports.forEach(gridViewport => {
    const { viewportId } = gridViewport.viewportOptions;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!viewport) {
      return;
    }
    syncGroupService.removeViewportFromSyncGroup(
      viewport.id,
      viewport.getRenderingEngine().id,
      syncName
    );
  });
}

/**
 * Gets the consistent spacing stack viewport types, which are the ones which
 * can be navigated using the stack image sync right now.
 */
function getReconstructableStackViewports(viewportGridService, displaySetService) {
  let { viewports } = viewportGridService.getState();

  viewports = [...viewports.values()];
  // filter empty viewports
  viewports = viewports.filter(
    viewport => viewport.displaySetInstanceUIDs && viewport.displaySetInstanceUIDs.length
  );

  // filter reconstructable viewports
  viewports = viewports.filter(viewport => {
    const { displaySetInstanceUIDs } = viewport;

    for (const displaySetInstanceUID of displaySetInstanceUIDs) {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      // TODO - add a better test than isReconstructable
      if (displaySet && displaySet.isReconstructable) {
        return true;
      }

      return false;
    }
  });
  return viewports;
}
