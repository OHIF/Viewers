import * as cornerstoneTools from '@cornerstonejs/tools';
import { updateSegmentationStats } from './updateSegmentationStats';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

/**
 * Sets up the handler for segmentation data modification events
 */
export function setupSegmentationDataModifiedHandler({
  segmentationService,
  customizationService,
  commandsManager,
}) {
  // A flag to indicate if the event is unsubscribed to. This is important because
  // the debounced callback does an await and in that period of time the event may have
  // been unsubscribed.
  let isUnsubscribed = false;
  const { unsubscribe: debouncedUnsubscribe } = segmentationService.subscribeDebounced(
    segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
    async ({ segmentationId }) => {
      const disableUpdateSegmentationStats = customizationService.getCustomization(
        'panelSegmentation.disableUpdateSegmentationStats'
      );

      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation || disableUpdateSegmentationStats) {
        return;
      }

      const readableText = customizationService.getCustomization('panelSegmentation.readableText');

      // Check for segments with bidirectional measurements and update them
      const segmentIndices = Object.keys(segmentation.segments)
        .map(index => parseInt(index))
        .filter(index => index > 0);

      for (const segmentIndex of segmentIndices) {
        const segment = segmentation.segments[segmentIndex];
        if (segment?.cachedStats?.namedStats?.bidirectional) {
          // Run the command to update the bidirectional measurement
          commandsManager.runCommand('runSegmentBidirectional', {
            segmentationId,
            segmentIndex,
          });
        }
      }

      const updatedSegmentation = await updateSegmentationStats({
        segmentation,
        segmentationId,
        readableText,
      });

      if (!isUnsubscribed && updatedSegmentation) {
        segmentationService.addOrUpdateSegmentation({
          segmentationId,
          segments: updatedSegmentation.segments,
        });
      }
    },
    1000
  );

  const unsubscribe = () => {
    isUnsubscribed = true;
    debouncedUnsubscribe();
  };
  return { unsubscribe };
}

/**
 * Sets up the handler for segmentation modification events
 */
export function setupSegmentationModifiedHandler({ segmentationService }) {
  const { unsubscribe } = segmentationService.subscribe(
    segmentationService.EVENTS.SEGMENTATION_MODIFIED,
    async ({ segmentationId }) => {
      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        return;
      }

      const annotationState = cornerstoneTools.annotation.state.getAllAnnotations();
      const bidirectionalAnnotations = annotationState.filter(
        annotation =>
          annotation.metadata.toolName === cornerstoneTools.SegmentBidirectionalTool.toolName
      );

      let toRemoveUIDs = [];
      if (!segmentation) {
        toRemoveUIDs = bidirectionalAnnotations.map(
          annotation => annotation.metadata.segmentationId === segmentationId
        );
        return;
      } else {
        const segmentIndices = Object.keys(segmentation.segments)
          .map(index => parseInt(index))
          .filter(index => index > 0);

        // check if there is a bidirectional data that exists but the segment
        // does not exists anymore we need to remove the bidirectional data
        const bidirectionalAnnotationsToRemove = bidirectionalAnnotations.filter(
          annotation =>
            annotation.metadata.segmentationId === segmentationId &&
            !segmentIndices.includes(annotation.metadata.segmentIndex)
        );

        toRemoveUIDs = bidirectionalAnnotationsToRemove.map(annotation => annotation.annotationUID);
      }

      toRemoveUIDs.forEach(uid => {
        cornerstoneTools.annotation.state.removeAnnotation(uid);
      });
    }
  );

  return { unsubscribe };
}

/**
 * Sets up auto tab switching for when the first segmentation is added into the viewer.
 */
export function setupAutoTabSwitchHandler({
  segmentationService,
  viewportGridService,
  panelService,
}) {
  const autoTabSwitchEvents = [
    segmentationService.EVENTS.SEGMENTATION_MODIFIED,
    segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
  ];

  // Initially there are no segmentations, so we should switch the tab whenever the first segmentation is added.
  let shouldSwitchTab = true;

  const unsubscribeAutoTabSwitchEvents = autoTabSwitchEvents
    .map(eventName =>
      segmentationService.subscribe(eventName, () => {
        const segmentations = segmentationService.getSegmentations();

        if (!segmentations.length) {
          // If all the segmentations are removed, then the next time a segmentation is added, we should switch the tab.
          shouldSwitchTab = true;
          return;
        }

        const activeViewportId = viewportGridService.getActiveViewportId();
        const activeRepresentation = segmentationService
          .getSegmentationRepresentations(activeViewportId)
          ?.find(representation => representation.active);

        if (activeRepresentation && shouldSwitchTab) {
          shouldSwitchTab = false;

          switch (activeRepresentation.type) {
            case SegmentationRepresentations.Labelmap:
              panelService.activatePanel(
                '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsLabelMap',
                true
              );
              break;
            case SegmentationRepresentations.Contour:
              panelService.activatePanel(
                '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsContour',
                true
              );
              break;
          }
        }
      })
    )
    .map(subscription => subscription.unsubscribe);

  return { unsubscribeAutoTabSwitchEvents };
}
