export const handleROIThresholding = async ({
  commandsManager,
  segmentationService,
}: withAppTypes<{
  segmentationId: string;
}>) => {
  const segmentations = segmentationService.getSegmentations();
  const tmtv = await commandsManager.run('calculateTMTV', { segmentations });

  // add the tmtv to all the segment cachedStats, although it is a global
  // value but we don't have any other way to display it for now
  // Update all segmentations with the calculated TMTV
  segmentations.forEach(segmentation => {
    segmentation.cachedStats = {
      ...segmentation.cachedStats,
      tmtv,
    };

    segmentationService.addOrUpdateSegmentation(segmentation);
  });
};
