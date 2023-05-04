async function _hydrateRTDisplaySet({
  rtDisplaySet,
  viewportIndex,
  servicesManager,
}) {
  const {
    segmentationService,
    hangingProtocolService,
    viewportGridService,
  } = servicesManager.services;

  const displaySetInstanceUID = rtDisplaySet.referencedDisplaySetInstanceUID;

  let segmentationId = null;

  // We need the hydration to notify panels about the new segmentation added
  const suppressEvents = false;

  segmentationId = await segmentationService.createSegmentationForRTDisplaySet(
    rtDisplaySet,
    segmentationId,
    suppressEvents
  );

  segmentationService.hydrateSegmentation(rtDisplaySet.displaySetInstanceUID);

  const { viewports } = viewportGridService.getState();

  const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
    viewportIndex,
    displaySetInstanceUID
  );

  viewportGridService.setDisplaySetsForViewports(updatedViewports);

  // Todo: fix this after we have a better way for stack viewport segmentations

  // check every viewport in the viewports to see if the displaySetInstanceUID
  // is being displayed, if so we need to update the viewport to use volume viewport
  // (if already is not using it) since Cornerstone3D currently only supports
  // volume viewport for segmentation
  viewports.forEach((viewport, index) => {
    if (index === viewportIndex) {
      return;
    }

    const shouldDisplaySeg = segmentationService.shouldRenderSegmentation(
      viewport.displaySetInstanceUIDs,
      rtDisplaySet.displaySetInstanceUID
    );

    if (shouldDisplaySeg) {
      updatedViewports.push({
        viewportIndex: index,
        displaySetInstanceUIDs: viewport.displaySetInstanceUIDs,
        viewportOptions: {
          initialImageOptions: {
            preset: 'middle',
          },
        },
      });
    }
  });

  // Do the entire update at once
  viewportGridService.setDisplaySetsForViewports(updatedViewports);
  return true;
}

export default _hydrateRTDisplaySet;
