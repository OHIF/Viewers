async function _hydrateSEGDisplaySet({
  segDisplaySet,
  viewportIndex,
  toolGroupId,
  servicesManager,
}) {
  const {
    SegmentationService,
    HangingProtocolService,
    ViewportGridService,
  } = servicesManager.services;

  const displaySetInstanceUID = segDisplaySet.referencedDisplaySetInstanceUID;

  let segmentationId = null;

  // We need the hydration to notify panels about the new segmentation added
  const suppressEvents = false;

  segmentationId = await SegmentationService.createSegmentationForSEGDisplaySet(
    segDisplaySet,
    segmentationId,
    suppressEvents
  );

  SegmentationService.hydrateSegmentation(segDisplaySet.displaySetInstanceUID);

  const { viewports } = ViewportGridService.getState();

  const updatedViewports = HangingProtocolService.getViewportsRequireUpdate(
    viewportIndex,
    displaySetInstanceUID
  );

  ViewportGridService.setDisplaySetsForViewports(updatedViewports);

  // Todo: fix this after we have a better way for stack viewport segmentations

  // check every viewport in the viewports to see if the displaySetInstanceUID
  // is being displayed, if so we need to update the viewport to use volume viewport
  // (if already is not using it) since Cornerstone3D currently only supports
  // volume viewport for segmentation
  viewports.forEach((viewport, index) => {
    if (index === viewportIndex) {
      return;
    }

    const shouldDisplaySeg = SegmentationService.shouldRenderSegmentation(
      viewport.displaySetInstanceUIDs,
      segDisplaySet.displaySetInstanceUID
    );

    if (shouldDisplaySeg) {
      ViewportGridService.setDisplaySetsForViewport({
        viewportIndex: index,
        displaySetInstanceUIDs: viewport.displaySetInstanceUIDs,
        viewportOptions: {
          viewportType: 'volume',
          toolGroupId,
          initialImageOptions: {
            preset: 'middle',
          },
        },
      });
    }
  });

  return true;
}

export default _hydrateSEGDisplaySet;
