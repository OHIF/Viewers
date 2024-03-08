const VOI_SYNC_NAME = 'VOI_SYNC';

const getSyncId = modality => `${VOI_SYNC_NAME}_${modality}`;

export default function toggleVOISliceSync({ servicesManager, viewports: providedViewports }) {
  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  const viewports =
    providedViewports || groupViewportsByModality(viewportGridService, displaySetService);

  // Todo: right now we don't have a proper way to define specific
  // viewports to add to synchronizers, and right now it is global or not
  // after we do that, we should do fine grained control of the synchronizers

  // we can apply voi sync within each modality group
  for (const [modality, modalityViewports] of Object.entries(viewports)) {
    const syncId = getSyncId(modality);

    const someViewportHasSync = modalityViewports.some(viewport => {
      const syncStates = syncGroupService.getSynchronizersForViewport(
        viewport.viewportOptions.viewportId
      );

      const imageSync = syncStates.find(syncState => syncState.id === syncId);

      return !!imageSync;
    });

    if (someViewportHasSync) {
      return disableSync(modalityViewports, syncId, servicesManager);
    }

    // create synchronization group and add the modalityViewports to it.
    modalityViewports.forEach(gridViewport => {
      const { viewportId } = gridViewport.viewportOptions;
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!viewport) {
        return;
      }
      syncGroupService.addViewportToSyncGroup(viewportId, viewport.getRenderingEngine().id, {
        type: 'voi',
        id: syncId,
        source: true,
        target: true,
      });
    });
  }
}

function disableSync(modalityViewports, syncId, servicesManager) {
  const { syncGroupService, cornerstoneViewportService } = servicesManager.services;

  const viewports = modalityViewports;
  viewports.forEach(gridViewport => {
    const { viewportId } = gridViewport.viewportOptions;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!viewport) {
      return;
    }
    syncGroupService.removeViewportFromSyncGroup(
      viewport.id,
      viewport.getRenderingEngine().id,
      syncId
    );
  });
}

function groupViewportsByModality(viewportGridService, displaySetService) {
  let { viewports } = viewportGridService.getState();

  viewports = [...viewports.values()];

  // group the viewports by modality
  return viewports.reduce((acc, viewport) => {
    const { displaySetInstanceUIDs } = viewport;
    // Todo: add proper fusion support
    const displaySetInstanceUID = displaySetInstanceUIDs[0];
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

    const modality = displaySet.Modality;
    if (!acc[modality]) {
      acc[modality] = [];
    }

    acc[modality].push(viewport);

    return acc;
  }, {});
}
