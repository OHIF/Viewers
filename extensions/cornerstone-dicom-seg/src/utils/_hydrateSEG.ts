async function _hydrateSEGDisplaySet({
  segDisplaySet,
  viewportIndex,
  toolGroupId,
  servicesManager,
}) {
  const { HangingProtocolService, SegmentationService, ViewportGridService } =
    servicesManager.services;

  const viewportsState = ViewportGridService.getState();

  const displaySetInstanceUIDs = [
    segDisplaySet.referencedDisplaySetInstanceUID,
    segDisplaySet.displaySetInstanceUID,
  ];

  let segmentationId = null;

  // We need the hydration to notify panels about the new segmentation added
  const suppressEvents = false;

  segmentationId = await SegmentationService.createSegmentationForSEGDisplaySet(
    segDisplaySet,
    segmentationId,
    suppressEvents
  );

  const defaultToolGroupId = 'default';
  const hydrateSegmentation = true;

  await SegmentationService.addSegmentationRepresentationToToolGroup(
    defaultToolGroupId,
    segmentationId,
    hydrateSegmentation
  );

  ViewportGridService.setDisplaySetsForViewport({
    viewportIndex,
    displaySetInstanceUIDs: displaySetInstanceUIDs,
    viewportOptions: {
      viewportType: 'volume',
      toolGroupId: defaultToolGroupId,
      initialImageOptions: {
        preset: 'middle',
      },
    },
  });
  return true;
}

export default _hydrateSEGDisplaySet;
