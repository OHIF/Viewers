import * as cornerstoneTools from '@cornerstonejs/tools';

interface BidirectionalAxis {
  length: number;
  // Add other axis properties as needed
}

interface BidirectionalData {
  majorAxis: BidirectionalAxis;
  minorAxis: BidirectionalAxis;
}

/**
 * Updates the statistics for a segmentation by calculating stats for each segment
 * and storing them in the segment's cachedStats property
 *
 * @param segmentation - The segmentation object containing segments to update stats for
 * @param segmentationId - The ID of the segmentation
 * @returns The updated segmentation object with new stats, or null if no updates were made
 */
export async function updateSegmentationStats({
  segmentation,
  segmentationId,
  readableText,
}: {
  segmentation: any;
  segmentationId: string;
  readableText: any;
}): Promise<any | null> {
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

    // Get existing namedStats or initialize if not present
    const namedStats = updatedSegmentation.segments[index].cachedStats.namedStats || {};

    if (segmentStats.array) {
      segmentStats.array.forEach(stat => {
        // only gather stats that are in the readableText
        if (!readableText[stat.name]) {
          return;
        }

        if (stat && stat.name) {
          namedStats[stat.name] = {
            name: stat.name,
            label: readableText[stat.name],
            value: stat.value,
            unit: stat.unit,
            order: Object.keys(readableText).indexOf(stat.name),
          };
        }
      });

      if (readableText.volume) {
        // Add volume if it exists but isn't in the array
        if (segmentStats.volume && !namedStats.volume) {
          namedStats.volume = {
            name: 'volume',
            label: 'Volume',
            value: segmentStats.volume.value,
            unit: segmentStats.volume.unit,
            order: Object.keys(readableText).indexOf('volume'),
          };
        }
      }

      // Update the segment's cachedStats with namedStats
      updatedSegmentation.segments[index].cachedStats.namedStats = namedStats;
      hasUpdates = true;
    }
  });

  return hasUpdates ? updatedSegmentation : null;
}

/**
 * Updates a segment's statistics with bidirectional measurement data
 *
 * @param segmentationId - The ID of the segmentation
 * @param segmentIndex - The index of the segment to update
 * @param bidirectionalData - The bidirectional measurement data to add
 * @param segmentationService - The segmentation service to use for updating the segment
 * @returns Whether the update was successful
 */
export function updateSegmentBidirectionalStats({
  segmentationId,
  segmentIndex,
  bidirectionalData,
  segmentationService,
  annotation,
}: {
  segmentationId: string;
  segmentIndex: number;
  bidirectionalData: BidirectionalData;
  segmentationService: AppTypes.SegmentationService;
  annotation: any;
}) {
  if (!segmentationId || segmentIndex === undefined || !bidirectionalData) {
    console.debug('Missing required data for bidirectional stats update');
    return null;
  }

  const segmentation = segmentationService.getSegmentation(segmentationId);
  if (!segmentation || !segmentation.segments[segmentIndex]) {
    console.debug('Segment not found:', segmentIndex, 'in segmentation:', segmentationId);
    return null;
  }

  const updatedSegmentation = { ...segmentation };
  const segment = updatedSegmentation.segments[segmentIndex];

  if (!segment.cachedStats) {
    segment.cachedStats = { namedStats: {} };
  }

  if (!segment.cachedStats.namedStats) {
    segment.cachedStats.namedStats = {};
  }

  const { majorAxis, minorAxis, maxMajor, maxMinor } = bidirectionalData;
  if (!majorAxis || !minorAxis) {
    console.debug('Missing major or minor axis data');
    return null;
  }

  let hasUpdates = false;
  const namedStats = segment.cachedStats.namedStats;

  // Only calculate and update if we have valid measurements
  if (maxMajor > 0 && maxMinor > 0) {
    namedStats.bidirectional = {
      name: 'bidirectional',
      label: 'Bidirectional',
      annotationUID: annotation.annotationUID,
      value: {
        maxMajor,
        maxMinor,
        majorAxis,
        minorAxis,
      },
      unit: 'mm',
    };

    hasUpdates = true;
  }

  if (hasUpdates) {
    return updatedSegmentation;
  }

  return null;
}
