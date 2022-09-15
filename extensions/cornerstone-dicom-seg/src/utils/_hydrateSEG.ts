async function _hydrateSEGDisplaySet({
  segDisplaySet,
  viewportIndex,
  toolGroupId,
  servicesManager,
}) {
  const { SegmentationService, ViewportGridService } = servicesManager.services;

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

  SegmentationService.hydrateSegmentation(segDisplaySet.displaySetInstanceUID);

  const defaultToolGroupId = 'default';

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
