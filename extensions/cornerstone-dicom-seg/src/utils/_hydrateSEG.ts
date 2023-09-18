async function _hydrateSEGDisplaySet({
  segDisplaySet,
  viewportId: targetViewportId,
  servicesManager,
}) {
  const { segmentationService, hangingProtocolService, viewportGridService } =
    servicesManager.services;

  const displaySetInstanceUID = segDisplaySet.referencedDisplaySetInstanceUID;

  let segmentationId = null;

  // We need the hydration to notify panels about the new segmentation added
  const suppressEvents = false;

  segmentationId = await segmentationService.createSegmentationForSEGDisplaySet(
    segDisplaySet,
    segmentationId,
    suppressEvents
  );

  segmentationService.hydrateSegmentation(segDisplaySet.displaySetInstanceUID);

  const { viewports } = viewportGridService.getState();

  const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
    targetViewportId,
    displaySetInstanceUID
  );

  // Todo: fix this after we have a better way for stack viewport segmentations

  // check every viewport in the viewports to see if the displaySetInstanceUID
  // is being displayed, if so we need to update the viewport to use volume viewport
  // (if already is not using it) since Cornerstone3D currently only supports
  // volume viewport for segmentation
  viewports.forEach((viewport, viewportId) => {
    if (targetViewportId === viewportId) {
      return;
    }

    const shouldDisplaySeg = segmentationService.shouldRenderSegmentation(
      viewport.displaySetInstanceUIDs,
      segDisplaySet.displaySetInstanceUID
    );

    if (shouldDisplaySeg) {
      updatedViewports.push({
        viewportId,
        displaySetInstanceUIDs: viewport.displaySetInstanceUIDs,
        viewportOptions: {
          // Note: This is a hack to get the grid to re-render the OHIFCornerstoneViewport component
          // Used for segmentation hydration right now, since the logic to decide whether
          // a viewport needs to render a segmentation lives inside the CornerstoneViewportService
          // so we need to re-render (force update via change of the needsRerendering) so that React
          // does the diffing and decides we should render this again (although the id and element has not changed)
          // so that the CornerstoneViewportService can decide whether to render the segmentation or not.
          needsRerendering: true,
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

export default _hydrateSEGDisplaySet;
