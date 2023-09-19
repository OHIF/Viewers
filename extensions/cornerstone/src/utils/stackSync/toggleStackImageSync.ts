const disableSync = (syncName, servicesManager) => {
  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;
  const viewports = getViewports(viewportGridService, displaySetService);
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
};

const getViewports = (viewportGridService, displaySetService) => {
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

  // viewports = viewports.filter(viewport => viewport.viewportOptions.viewportType === 'stack');

  console.log('viewports=', viewports);
  return viewports;
};

const STACK_SYNC_NAME = 'stackImageSync';

export default function toggleStackImageSync({
  toggledState,
  servicesManager,
  viewports: providedViewports,
}) {
  if (!toggledState) {
    return disableSync(STACK_SYNC_NAME, servicesManager);
  }

  console.log('Toggling stack image sync');
  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  const viewports = providedViewports || getViewports(viewportGridService, displaySetService);

  // create synchronization group and add the viewports to it.
  viewports.forEach(gridViewport => {
    const { viewportId } = gridViewport.viewportOptions;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!viewport) {
      return;
    }
    syncGroupService.addViewportToSyncGroup(viewportId, viewport.getRenderingEngine().id, {
      type: 'stackimage',
      id: STACK_SYNC_NAME,
      source: true,
      target: true,
    });
  });
}
