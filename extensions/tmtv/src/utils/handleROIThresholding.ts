import { cache } from '@cornerstonejs/core';
import { segmentation as csToolsSegmentation, type Types } from '@cornerstonejs/tools';

export const handleROIThresholding = async ({
  segmentationId,
  commandsManager,
  segmentationService,
  config = {},
}) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);
  const csSegmentation = csToolsSegmentation.state.getSegmentation(segmentationId);

  const labelmapData = csSegmentation.representationData
    .Labelmap as Types.LabelmapToolOperationDataVolume;
  const volumeId = labelmapData.volumeId;

  // re-calculating the cached stats for the active segmentation
  const updatedPerSegmentCachedStats = {};
  segmentation.segments = await Promise.all(
    segmentation.segments.map(async segment => {
      if (!segment || !segment.segmentIndex) {
        return segment;
      }

      const labelmap = cache.getVolume(volumeId);

      const segmentIndex = segment.segmentIndex;

      const lesionStats = commandsManager.run('getLesionStats', {
        segmentation,
        labelmap,
        segmentIndex,
      });
      const suvPeak = await commandsManager.run('calculateSuvPeak', {
        labelmap,
        segmentation,
        segmentIndex,
      });
      const lesionGlyoclysisStats = lesionStats.volume * lesionStats.meanValue;

      // update segDetails with the suv peak for the active segmentation
      const cachedStats = {
        lesionStats,
        suvPeak,
        lesionGlyoclysisStats,
      };

      segment.cachedStats = cachedStats;
      segment.displayText = [
        `SUV Peak: ${suvPeak.suvPeak.toFixed(2)}`,
        `Volume: ${lesionStats.volume.toFixed(2)} mm3`,
      ];
      updatedPerSegmentCachedStats[segmentIndex] = cachedStats;

      return segment;
    })
  );

  const notYetUpdatedAtSource = true;

  const segmentations = segmentationService.getSegmentations();
  const tmtv = commandsManager.run('calculateTMTV', { segmentations });

  segmentation.cachedStats = Object.assign(segmentation.cachedStats, updatedPerSegmentCachedStats, {
    tmtv: {
      value: tmtv.toFixed(3),
      config: { ...config },
    },
  });

  segmentationService.addOrUpdateSegmentation(
    {
      ...segmentation,
    },
    false, // don't suppress events
    notYetUpdatedAtSource
  );
};
