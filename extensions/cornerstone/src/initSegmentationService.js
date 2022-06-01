import { eventTarget, cache, triggerEvent } from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import { Enums as csToolsEnums } from '@cornerstonejs/tools';
import Labelmap from './utils/segmentationServiceMappings/Labelmap';

function initSegmentationService(
  SegmentationService,
  CornerstoneViewportService
) {
  connectToolsToSegmentationService(
    SegmentationService,
    CornerstoneViewportService
  );

  connectSegmentationServiceToTools(
    SegmentationService,
    CornerstoneViewportService
  );
}

function connectToolsToSegmentationService(
  SegmentationService,
  CornerstoneViewportService
) {
  connectSegmentationServiceToTools(
    SegmentationService,
    CornerstoneViewportService
  );
  const segmentationUpdated = csToolsEnums.Events.SEGMENTATION_MODIFIED;

  eventTarget.addEventListener(segmentationUpdated, evt => {
    const { segmentationId } = evt.detail;
    const segmentationState = csTools.segmentation.state.getSegmentation(
      segmentationId
    );

    if (!segmentationState) {
      return;
    }

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
  CornerstoneViewportService
) {
  const {
    SEGMENTATION_UPDATED,
    SEGMENTATION_REMOVED,
  } = SegmentationService.EVENTS;

  SegmentationService.subscribe(SEGMENTATION_REMOVED, ({ id }) => {
    // Todo: This should be from the configuration
    const removeFromCache = true;

    const sourceSegState = csTools.segmentation.state.getSegmentation(id);

    if (!sourceSegState) {
      return;
    }

    const toolGroupIds = csTools.segmentation.state.getToolGroupsWithSegmentation(
      id
    );

    toolGroupIds.forEach(toolGroupId => {
      const segmentationRepresentations = csTools.segmentation.state.getSegmentationRepresentations(
        toolGroupId
      );

      const UIDsToRemove = [];
      segmentationRepresentations.forEach(representation => {
        if (representation.segmentationId === id) {
          UIDsToRemove.push(representation.segmentationRepresentationUID);
        }
      });

      csTools.segmentation.removeSegmentationsFromToolGroup(
        toolGroupId,
        UIDsToRemove
      );
    });

    // cleanup the segmentation state too
    csTools.segmentation.state.removeSegmentation(id);

    if (removeFromCache) {
      cache.removeVolumeLoadObject(id);
    }
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
