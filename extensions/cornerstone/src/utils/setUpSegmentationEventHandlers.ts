import { Enums as csToolsEnums } from '@cornerstonejs/tools';

import {
  setUpSelectedSegmentationsForViewportHandler,
  setupSegmentationDataModifiedHandler,
  setupSegmentationModifiedHandler,
} from './segmentationHandlers';

export const setUpSegmentationEventHandlers = ({ servicesManager, commandsManager }) => {
  const { segmentationService, customizationService, displaySetService, viewportGridService } =
    servicesManager.services;

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
      const label = segmentation.label;
      const imageIds =
        segmentation.representationData?.Labelmap?.imageIds ??
        segmentation.representationData?.Contour?.imageIds;

      // Create a display set for the segmentation
      const segmentationDisplaySet = {
        displaySetInstanceUID: segmentationId,
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
        SOPClassHandlerId: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
        SeriesDescription: label,
        Modality: segmentation.representationData[csToolsEnums.SegmentationRepresentations.Contour]
          ? 'RTSTRUCT'
          : 'SEG',
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

  const { unsubscribe: unsubscribeSegmentationRemoved } = segmentationService.subscribe(
    segmentationService.EVENTS.SEGMENTATION_REMOVED,
    ({ segmentationId }) => {
      const displaySet = displaySetService.getDisplaySetByUID(segmentationId);

      // Remove the display set layer from all viewports that have it
      if (displaySet) {
        const state = viewportGridService.getState();
        const viewports = state.viewports;

        // Find all viewports that contain this segmentation's display set as a layer
        for (const [viewportId, viewport] of viewports.entries()) {
          const displaySetInstanceUIDs = viewport.displaySetInstanceUIDs || [];
          if (displaySetInstanceUIDs.includes(segmentationId)) {
            // Remove the display set layer from this viewport
            commandsManager.runCommand('removeDisplaySetLayer', {
              viewportId,
              displaySetInstanceUID: segmentationId,
            });
          }
        }

        // Delete the display set from the service if it was made in client
        if (displaySet.madeInClient) {
          displaySetService.deleteDisplaySet(segmentationId);
        }
      }
    }
  );

  const { unsubscribeSelectedSegmentationsForViewportEvents } =
    setUpSelectedSegmentationsForViewportHandler({
      segmentationService,
    });

  const unsubscriptions = [
    unsubscribeSegmentationDataModifiedHandler,
    unsubscribeSegmentationModifiedHandler,
    unsubscribeSegmentationCreated,
    unsubscribeSegmentationRemoved,
    ...unsubscribeSelectedSegmentationsForViewportEvents,
  ];

  return { unsubscriptions };
};
