import { eventTarget, Enums, triggerEvent } from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { Enums as csToolsEnums } from '@cornerstonejs/tools';
import Labelmap from './utils/segmentationServiceMappings/Labelmap';

function initSegmentationService(
  SegmentationService,
  Cornerstone3DViewportService
) {
  connectToolsToSegmentationService(
    SegmentationService,
    Cornerstone3DViewportService
  );

  connectSegmentationServiceToTools(
    SegmentationService,
    Cornerstone3DViewportService
  );
}

function connectToolsToSegmentationService(
  SegmentationService,
  Cornerstone3DViewportService
) {
  connectSegmentationServiceToTools(
    SegmentationService,
    Cornerstone3DViewportService
  );
  const segmentationUpdated = csToolsEnums.Events.SEGMENTATION_MODIFIED;

  eventTarget.addEventListener(segmentationUpdated, evt => {
    const { segmentationId } = evt.detail;
    const segmentationState = csTools.segmentation.state.getSegmentation(
      segmentationId
    );

    if (
      !Object.keys(segmentationState.representationData).includes(
        csToolsEnums.SegmentationRepresentations.Labelmap
      )
    ) {
      throw new Error('Non-labelmap representations are not supported yet');
    }

    // Todo: handle other representations when available in cornerstone3D
    const segmentationSchema = Labelmap.toSegmentation(segmentationState);

    try {
      SegmentationService.addOrUpdateSegmentation(
        segmentationId,
        segmentationSchema
      );
    } catch (error) {
      console.warn(
        `Failed to add/update segmentation ${segmentationId}`,
        error
      );
    }
  });
}

function connectSegmentationServiceToTools(
  SegmentationService,
  Cornerstone3DViewportService
) {
  const {
    SEGMENTATION_UPDATED,
    SEGMENTATION_REMOVED,
  } = SegmentationService.EVENTS;

  SegmentationService.subscribe(SEGMENTATION_REMOVED, ({ id }) => {
    const removeFromCache = true;

    const sourceSegState = csTools.segmentation.state.getSegmentation(id);

    debugger;

    // SegmentationModule.removeLabelmapForAllElements(
    //   segmentationId,
    //   removeFromCache
    // );

    // Cornerstone3DViewportService.getRenderingEngine().render();
  });

  SegmentationService.subscribe(
    SEGMENTATION_UPDATED,
    ({ id, segmentation, notYetUpdatedAtSource }) => {
      if (notYetUpdatedAtSource === false) {
        return;
      }
      const { label, text } = segmentation;

      const sourceSegmentation = csTools.segmentation.state.getSegmentation(id);

      // Update the label in the source if necessary
      if (sourceSegmentation.label !== label) {
        sourceSegmentation.label = label;
      }

      if (sourceSegmentation.text !== text) {
        sourceSegmentation.text = text;
      }

      triggerEvent(eventTarget, csTools.Enums.Events.SEGMENTATION_MODIFIED, {
        segmentationId: id,
      });
    }
  );
}

export default initSegmentationService;
