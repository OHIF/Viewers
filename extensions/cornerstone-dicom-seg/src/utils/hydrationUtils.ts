const checkActiveViewportForSegmentation = ({ displaySetInstanceUIDs, uiNotificationService }) => {
  if (displaySetInstanceUIDs.length > 1) {
    uiNotificationService.show({
      title: 'Segmentation',
      message: 'Segmentation is not supported for multiple display sets yet',
      type: 'error',
    });
    return false;
  }
  return true;
};

const hydrateUsingDisplaySets = async ({ segDisplaySet, segmentationService, segmentationId }) => {
  const suppressEvents = false;
  const serviceFunction =
    segDisplaySet.Modality === 'SEG'
      ? 'createSegmentationForSEGDisplaySet'
      : 'createSegmentationForRTDisplaySet';

  const load = segmentationService[serviceFunction].bind(segmentationService);
  segmentationId = await load(segDisplaySet, segmentationId, suppressEvents);
  segmentationService.hydrateSegmentation(segmentationId);

  return segmentationId;
};

const hydrateUsingSegmentations = async ({
  segmentations,
  displaySetInstanceUID,
  activeViewport,
  segmentationService,
}) => {
  const segmentation = segmentations[0];
  const segmentationId = segmentation.id;
  const label = segmentation.label;
  const segments = segmentation.segments;

  delete segmentation.segments;

  await segmentationService.createSegmentationForDisplaySet(displaySetInstanceUID, {
    segmentationId,
    label,
  });

  const labelmapVolume = segmentationService.getLabelmapVolume(segmentationId);
  labelmapVolume.scalarData.set(segmentation.scalarData);
  segmentationService.addOrUpdateSegmentation(segmentation);

  const toolGroupId = activeViewport.viewportOptions.toolGroupId;
  await segmentationService.addSegmentationRepresentationToToolGroup(toolGroupId, segmentationId);

  segments.forEach(segment => {
    if (segment === null) {
      return;
    }
    segmentationService.addSegment(segmentationId, {
      segmentIndex: segment.segmentIndex,
      toolGroupId,
      properties: {
        color: segment.color,
        label: segment.label,
        opacity: segment.opacity,
        isLocked: segment.isLocked,
        visibility: segment.isVisible,
        active: segmentation.activeSegmentIndex === segment.segmentIndex,
      },
    });
  });

  if (segmentation.centroidsIJK) {
    segmentationService.setCentroids(segmentation.id, segmentation.centroidsIJK);
  }

  return segmentationId;
};

const hydrateUsingNewSegmentation = async ({
  displaySetInstanceUID,
  activeViewport,
  segmentationService,
}) => {
  const currentSegmentations = segmentationService.getSegmentations();
  const segmentationId = await segmentationService.createSegmentationForDisplaySet(
    displaySetInstanceUID,
    { label: `Segmentation ${currentSegmentations.length + 1}` }
  );

  await segmentationService.addSegmentationRepresentationToToolGroup(
    activeViewport.viewportOptions.toolGroupId,
    segmentationId
  );

  segmentationService.addSegment(segmentationId, {
    properties: {
      label: 'Segment 1',
    },
  });

  return segmentationId;
};

export {
  checkActiveViewportForSegmentation,
  hydrateUsingDisplaySets,
  hydrateUsingSegmentations,
  hydrateUsingNewSegmentation,
};
