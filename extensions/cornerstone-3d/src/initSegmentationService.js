import { eventTarget, Enums } from '@cornerstonejs/core';
import { segmentation, Enums as csToolsEnums } from '@cornerstonejs/tools';

import SegmentationServiceMappingsFactory from './utils/segmentationServiceMappings/segmentationServiceMappingsFactory';

const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';

const connectToolsToSegmentationService = (
  SegmentationService,
  DisplaySetService,
  Cornerstone3DViewportService
) => {
  const cs3DToolsSegmentationSource = initSegmentationService(
    SegmentationService,
    DisplaySetService
  );
  connectSegmentationServiceToTools(
    SegmentationService,
    Cornerstone3DViewportService,
    cs3DToolsSegmentationSource
  );
  const { addOrUpdate, remove } = cs3DToolsSegmentationSource;
  const segmentationUpdated = csToolsEnums.Events.SEGMENTATION_MODIFIED;

  eventTarget.addEventListener(segmentationUpdated, evt => {
    const { segmentationId } = evt.detail;

    const activeSegmentIndex = segmentation.state.getSegmentation(
      segmentationId
    );

    try {
      const representationId = 'Labelmap';
      addOrUpdate(representationId, {
        segmentationId,
        activeSegmentIndex,
      });
    } catch (error) {
      console.warn('Failed to update measurement:', error);
    }
  });

  return cs3DToolsSegmentationSource;
};

const initSegmentationService = (SegmentationService, DisplaySetService) => {
  /* Initialization */
  const { Labelmap } = SegmentationServiceMappingsFactory(
    SegmentationService,
    DisplaySetService
  );
  const cs3DToolsSegmentationSource = SegmentationService.createSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  /* Mappings */
  SegmentationService.addMapping(
    cs3DToolsSegmentationSource,
    'Labelmap',
    Labelmap.matchingCriteria,
    () => {}, // to source
    Labelmap.toSegmentation
  );

  return cs3DToolsSegmentationSource;
};

const connectSegmentationServiceToTools = (
  SegmentationService,
  Cornerstone3DViewportService,
  segmentationSource
) => {
  const {
    SEGMENTATIONS_CLEARED,
    SEGMENTATION_UPDATED,
    SEGMENTATION_REMOVED,
  } = SegmentationService.EVENTS;
  const sourceId = segmentationSource.id;

  SegmentationService.subscribe(
    SEGMENTATION_REMOVED,
    ({ source, segmentationId }) => {
      debugger;
      // Todo: for now remove from all viewports
      const removeFromCache = true;
      SegmentationModule.removeLabelmapForAllElements(
        segmentationId,
        removeFromCache
      );

      Cornerstone3DViewportService.getRenderingEngine().render();
    }
  );

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
};

export {
  initSegmentationService,
  connectToolsToSegmentationService,
  connectSegmentationServiceToTools,
};
