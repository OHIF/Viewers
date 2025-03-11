import * as cornerstoneTools from '@cornerstonejs/tools';

/**
 * Updates the statistics for a segmentation by calculating stats for each segment
 * and storing them in the segment's cachedStats property
 *
 * @param segmentation - The segmentation object containing segments to update stats for
 * @param segmentationId - The ID of the segmentation
 * @returns The updated segmentation object with new stats, or null if no updates were made
 */
export async function updateSegmentationStats(
  segmentation: any,
  segmentationId: string
): Promise<any | null> {
  if (!segmentation) {
    console.debug('No segmentation found for id:', segmentationId);
    return null;
  }

  const segmentIndices = Object.keys(segmentation.segments)
    .map(index => parseInt(index))
    .filter(index => index > 0); // Filter out segment 0 which is typically background

  if (segmentIndices.length === 0) {
    console.debug('No segments found in segmentation:', segmentationId);
    return null;
  }

  const stats = await cornerstoneTools.utilities.segmentation.getStatistics({
    segmentationId,
    segmentIndices,
    mode: 'individual',
  });

  if (!stats) {
    return null;
  }

  const updatedSegmentation = { ...segmentation };
  let hasUpdates = false;

  // Loop through each segment's stats
  Object.entries(stats).forEach(([segmentIndex, segmentStats]) => {
    const index = parseInt(segmentIndex);

    if (!updatedSegmentation.segments[index].cachedStats) {
      updatedSegmentation.segments[index].cachedStats = {};
      hasUpdates = true;
    }

    // Create namedStats object from array data
    const namedStats = {};
    if (segmentStats.array) {
      segmentStats.array.forEach(stat => {
        if (stat && stat.name) {
          namedStats[stat.name] = {
            name: stat.name,
            label: stat.label || stat.name,
            value: stat.value,
            unit: stat.unit,
          };
        }
      });

      // Add volume if it exists but isn't in the array
      if (segmentStats.volume && !namedStats.volume) {
        namedStats.volume = {
          name: 'volume',
          label: 'Volume',
          value: segmentStats.volume.value,
          unit: segmentStats.volume.unit,
        };
      }

      // Update the segment's cachedStats with namedStats
      updatedSegmentation.segments[index].cachedStats.namedStats = namedStats;
      hasUpdates = true;
    }
  });

  return hasUpdates ? updatedSegmentation : null;
}
