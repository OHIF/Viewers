import calculateViewportRegistrations from './calculateViewportRegistrations';

// [ {
//   synchronizerId: string,
//   viewports: [ { viewportId: number, renderingEngineId: string, index: number } , ...]
// ]}
let STACK_IMAGE_SYNC_GROUPS_INFO = [];

export default function toggleStackImageSync({
  toggledState,
  servicesManager,
  getEnabledElement,
}) {
  const {
    SyncGroupService,
    ViewportGridService,
    DisplaySetService,
    CornerstoneViewportService,
  } = servicesManager.services;

  if (!toggledState) {
    STACK_IMAGE_SYNC_GROUPS_INFO.forEach(syncGroupInfo => {
      const { viewports, synchronizerId } = syncGroupInfo;

      viewports.forEach(({ viewportId, renderingEngineId }) => {
        SyncGroupService.removeViewportFromSyncGroup(
          viewportId,
          renderingEngineId,
          synchronizerId
        );
      });
    });

    return;
  }

  STACK_IMAGE_SYNC_GROUPS_INFO = [];

  // create synchronization groups and add viewports
  let { viewports } = ViewportGridService.getState();

  // filter empty viewports
  viewports = viewports.filter(
    viewport =>
      viewport.displaySetInstanceUIDs && viewport.displaySetInstanceUIDs.length
  );

  // filter reconstructable viewports
  viewports = viewports.filter(viewport => {
    const { displaySetInstanceUIDs } = viewport;

    for (const displaySetInstanceUID of displaySetInstanceUIDs) {
      const displaySet = DisplaySetService.getDisplaySetByUID(
        displaySetInstanceUID
      );

      if (displaySet && displaySet.isReconstructable) {
        return true;
      }

      return false;
    }
  });

  const viewportsByOrientation = viewports.reduce((acc, viewport) => {
    const { viewportId, viewportType } = viewport.viewportOptions;

    if (viewportType !== 'stack') {
      console.warn('Viewport is not a stack, cannot sync images yet');
      return acc;
    }

    const { element } = CornerstoneViewportService.getViewportInfo(viewportId);
    const { viewport: csViewport, renderingEngineId } = getEnabledElement(
      element
    );
    const { viewPlaneNormal } = csViewport.getCamera();

    // Should we round here? I guess so, but not sure how much precision we need
    const orientation = viewPlaneNormal.map(v => Math.round(v)).join(',');

    if (!acc[orientation]) {
      acc[orientation] = [];
    }

    acc[orientation].push({ viewportId, renderingEngineId });

    return acc;
  }, {});

  // create synchronizer for each group
  Object.values(viewportsByOrientation).map(viewports => {
    let synchronizerId = viewports
      .map(({ viewportId }) => viewportId)
      .join(',');

    synchronizerId = `imageSync_${synchronizerId}`;

    calculateViewportRegistrations(viewports);

    viewports.forEach(({ viewportId, renderingEngineId }) => {
      SyncGroupService.addViewportToSyncGroup(viewportId, renderingEngineId, {
        type: 'stackimage',
        id: synchronizerId,
        source: true,
        target: true,
      });
    });

    STACK_IMAGE_SYNC_GROUPS_INFO.push({
      synchronizerId,
      viewports,
    });
  });
}
