function getUpdatedViewportsForSegmentation({
  viewportId,
  servicesManager,
  displaySetInstanceUIDs,
}: withAppTypes) {
  const { hangingProtocolService, viewportGridService } = servicesManager.services;

  const { isHangingProtocolLayout } = viewportGridService.getState();

  const viewport = getTargetViewport({ viewportId, viewportGridService });
  const targetViewportId = viewport.viewportOptions.viewportId;

  const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
    targetViewportId,
    displaySetInstanceUIDs[0],
    isHangingProtocolLayout
  );

  return updatedViewports.filter(v => v.viewportOptions?.viewportType !== 'volume3d');
}

const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;

  const viewport = viewports.get(targetViewportId);

  return viewport;
};

export { getUpdatedViewportsForSegmentation };
