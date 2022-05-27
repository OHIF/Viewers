import { eventTarget, Enums } from '@cornerstonejs/core';
import { segmentation, Enums as csToolsEnums } from '@cornerstonejs/tools';
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
    const segmentationState = segmentation.state.getSegmentation(
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
    SEGMENTATIONS_CLEARED,
    SEGMENTATION_UPDATED,
    SEGMENTATION_ADDED,
    SEGMENTATION_REMOVED,
  } = SegmentationService.EVENTS;

  SegmentationService.subscribe(SEGMENTATION_REMOVED, ({ source, id }) => {
    debugger;
    // Todo: for now remove from all viewports
    const removeFromCache = true;
    SegmentationModule.removeLabelmapForAllElements(
      segmentationId,
      removeFromCache
    );

    Cornerstone3DViewportService.getRenderingEngine().render();
  });

  SegmentationService.subscribe(SEGMENTATIONS_CLEARED, () => {
    debugger;
    // globalImageIdSpecificToolStateManager.restoreToolState({});
    // _refreshViewports();
  });

  SegmentationService.subscribe(
    SEGMENTATION_UPDATED,
    ({ source, segmentation, notYetUpdatedAtSource }) => {
      debugger;
      if (
        source.name === 'CornerstoneTools' &&
        notYetUpdatedAtSource === false
      ) {
        // This event was fired by cornerstone telling the measurement service to sync. Already in sync.
        return;
      }

      const { id, label, cachedStats } = segmentation;
      SegmentationModule.setLabelmapGlobalState(id, {
        volumeUID: id,
        label,
        cachedStats,
      });
    }
  );
}

export default initSegmentationService;
