import {
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
} from './segmentationHandlers';

export const setUpSegmentationEventHandlers = ({ servicesManager, commandsManager }) => {
  const { segmentationService, customizationService, displaySetService } = servicesManager.services;

  const { unsubscribe: unsubscribeSegmentationDataModifiedHandler } =
    setupSegmentationDataModifiedHandler({
      segmentationService,
      customizationService,
      commandsManager,
    });

  const { unsubscribe: unsubscribeSegmentationModifiedHandler } = setupSegmentationModifiedHandler({
    segmentationService,
  });

  const { unsubscribe: unsubscribeSegmentationCreated } = segmentationService.subscribe(
    segmentationService.EVENTS.SEGMENTATION_ADDED,
    evt => {
      const { segmentationId } = evt;
      const displaySet = displaySetService.getDisplaySetByUID(segmentationId);
      if (displaySet) {
        return;
      }

      const segmentation = segmentationService.getSegmentation(segmentationId);
      const label = segmentation.cachedStats.info;
      const imageIds = segmentation.representationData.Labelmap.imageIds;

      // Create a display set for the segmentation
      const segmentationDisplaySet = {
        displaySetInstanceUID: segmentationId,
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
        SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
        SeriesDescription: label,
        Modality: 'SEG',
        numImageFrames: imageIds.length,
        imageIds,
        isOverlayDisplaySet: true,
        label,
        madeInClient: true,
        segmentationId: segmentationId,
        isDerived: true,
      };

      displaySetService.addDisplaySets(segmentationDisplaySet);
    }
  );

  const unsubscriptions = [
    unsubscribeSegmentationDataModifiedHandler,
    unsubscribeSegmentationModifiedHandler,
    unsubscribeSegmentationCreated,
  ];

  return { unsubscriptions };
};
