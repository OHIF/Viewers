import { Segment, Segmentation } from '@cornerstonejs/tools/types';

export const handleROIThresholding = async ({
  segmentationId,
  commandsManager,
  segmentationService,
  config = {},
}: withAppTypes<{
  segmentationId: string;
  config: Record<string, any>;
}>) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);

  // re-calculating the cached stats for the active segmentation
  const updatedPerSegmentCachedStats = {};
  await Promise.all(
    Object.entries(segmentation.segments).map(async ([segmentIndex, segment]) => {
      if (!segment) {
        return [segmentIndex, segment];
      }

      const lesionStats = commandsManager.run('getLesionStats', {
        segmentationId,
        segmentIndex: Number(segmentIndex),
      });
      const suvPeak = await commandsManager.run('calculateSuvPeak', {
        segmentationId,
        segmentIndex: Number(segmentIndex),
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

      updatedPerSegmentCachedStats[Number(segmentIndex)] = cachedStats;

      return [segmentIndex, updatedSegment];
    })
  );

  // all available segmentations
  const segmentationsInfo = segmentationService.getSegmentationsInfo();

  const segmentations = segmentationsInfo.map(({ segmentation }) => segmentation);
  const tmtv = commandsManager.run('calculateTMTV', { segmentations });

  // add the tmtv to all the segment cachedStats, although it is a global
  // value but we don't have any other way to display it for now
  Object.values(segmentation.segments).forEach(segment => {
    if (segment) {
      segment.cachedStats = {
        ...segment.cachedStats,
        tmtv,
      };
    }
  });

  // Update the segmentation object
  const updatedSegmentation: Segmentation = {
    ...segmentation,
    segments: {
      ...segmentation.segments,
    },
  };

  segmentationService.addOrUpdateSegmentation(segmentationId, updatedSegmentation);
};
