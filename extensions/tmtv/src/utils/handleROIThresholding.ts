import { Segment, Segmentation } from '@cornerstonejs/tools/types';
import { triggerEvent, eventTarget, Enums } from '@cornerstonejs/core';

export const handleROIThresholding = async ({
  segmentationId,
  commandsManager,
  segmentationService,
}: withAppTypes<{
  segmentationId: string;
}>) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);

  triggerEvent(eventTarget, Enums.Events.WEB_WORKER_PROGRESS, {
    progress: 0,
    type: 'Calculate Lesion Stats',
    id: segmentationId,
  });

  // re-calculating the cached stats for the active segmentation
  const updatedPerSegmentCachedStats = {};
  for (const [segmentIndex, segment] of Object.entries(segmentation.segments)) {
    if (!segment) {
      continue;
    }

    const numericSegmentIndex = Number(segmentIndex);

    const lesionStats = await commandsManager.run('getLesionStats', {
      segmentationId,
      segmentIndex: numericSegmentIndex,
    });

    const suvPeak = await commandsManager.run('calculateSuvPeak', {
      segmentationId,
      segmentIndex: numericSegmentIndex,
    });

    const lesionGlyoclysisStats = lesionStats.volume * lesionStats.meanValue;

    // update segDetails with the suv peak for the active segmentation
    const cachedStats = {
      lesionStats,
      suvPeak,
      lesionGlyoclysisStats,
    };

    const updatedSegment: Segment = {
      ...segment,
      cachedStats: {
        ...segment.cachedStats,
        ...cachedStats,
      },
    };

    updatedPerSegmentCachedStats[numericSegmentIndex] = cachedStats;

    segmentation.segments[segmentIndex] = updatedSegment;
  }

  // all available segmentations
  const segmentations = segmentationService.getSegmentations();
  const tmtv = await commandsManager.run('calculateTMTV', { segmentations });

  triggerEvent(eventTarget, Enums.Events.WEB_WORKER_PROGRESS, {
    progress: 100,
    type: 'Calculate Lesion Stats',
    id: segmentationId,
  });

  // add the tmtv to all the segment cachedStats, although it is a global
  // value but we don't have any other way to display it for now
  // Update all segmentations with the calculated TMTV
  segmentations.forEach(segmentation => {
    segmentation.cachedStats = {
      ...segmentation.cachedStats,
      tmtv,
    };

    // Update each segment within the segmentation
    Object.keys(segmentation.segments).forEach(segmentIndex => {
      segmentation.segments[segmentIndex].cachedStats = {
        ...segmentation.segments[segmentIndex].cachedStats,
        tmtv,
      };
    });

    // Update the segmentation object
    const updatedSegmentation: Segmentation = {
      ...segmentation,
      segments: {
        ...segmentation.segments,
      },
    };

    segmentationService.addOrUpdateSegmentation(updatedSegmentation);
  });
};
