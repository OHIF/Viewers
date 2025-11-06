/**
 * Segmentation measurement and statistics utilities
 * Extracted from segmentationCommands.ts
 */

export interface SegmentationMeasurementParams {
  segmentationService: any;
  uiNotificationService: any;
  viewportGridService: any;
}

/**
 * Calculates statistics for all segments in a segmentation
 */
export function calculateSegmentStatistics(
  { segmentationId }: { segmentationId: string },
  { segmentationService }: SegmentationMeasurementParams
) {
  return segmentationService.calculateSegmentationStats(segmentationId);
}

/**
 * Runs bidirectional measurement on a segment
 */
export async function xnatRunSegmentBidirectional(
  { segmentationId, segmentIndex }: { segmentationId: string; segmentIndex: number },
  { segmentationService, uiNotificationService, viewportGridService }: SegmentationMeasurementParams
) {
  try {
    // Get the segmentation and segment
    const segmentation = segmentationService.getSegmentation(segmentationId);
    if (!segmentation || !segmentation.segments || !segmentation.segments[segmentIndex]) {
      throw new Error('Segment not found');
    }

    const segment = segmentation.segments[segmentIndex];

    // Check if segment has cached stats with center information
    if (!segment.cachedStats || (!segment.cachedStats.center && !segment.cachedStats.namedStats?.center?.value)) {
      throw new Error('Segment center information not available');
    }

    // Get segment center
    const center = segment.cachedStats.namedStats?.center?.value || segment.cachedStats.center;

    if (!center || center.length !== 3) {
      throw new Error('Invalid segment center data');
    }

    // Get viewport information
    const viewportId = viewportGridService.getActiveViewportId();
    if (!viewportId) {
      throw new Error('No active viewport found');
    }

    // Calculate long and short axis lengths
    const stats = segment.cachedStats;
    if (!stats || !stats.namedStats) {
      throw new Error('Segment statistics not available');
    }

    // Look for relevant measurements in namedStats
    const measurements = stats.namedStats;
    let longAxis = null;
    let shortAxis = null;

    // Try to find axis measurements
    for (const [key, stat] of Object.entries(measurements)) {
      if (stat.label && stat.label.toLowerCase().includes('long') && stat.label.toLowerCase().includes('axis')) {
        longAxis = stat.value;
      }
      if (stat.label && stat.label.toLowerCase().includes('short') && stat.label.toLowerCase().includes('axis')) {
        shortAxis = stat.value;
      }
    }

    if (longAxis === null || shortAxis === null) {
      throw new Error('Long and short axis measurements not found');
    }

    // Create bidirectional measurement at segment center
    const measurementData = {
      toolType: 'Bidirectional',
      data: {
        handles: {
          points: [
            // Start point (center - half long axis)
            [center[0] - longAxis / 2, center[1], center[2]],
            // End point (center + half long axis)
            [center[0] + longAxis / 2, center[1], center[2]],
            // Start point for perpendicular (center - half short axis)
            [center[0], center[1] - shortAxis / 2, center[2]],
            // End point for perpendicular (center + half short axis)
            [center[0], center[1] + shortAxis / 2, center[2]],
          ],
        },
        cachedStats: {
          length: longAxis,
          length2: shortAxis,
        },
        active: true,
      },
      metadata: {
        toolName: 'Bidirectional',
        viewPlaneNormal: [0, 0, 1],
        viewUp: [0, 1, 0],
        FrameOfReferenceUID: segmentation.FrameOfReferenceUID,
        referencedImageId: null,
      },
    };

    // Add measurement to cornerstone tools
    const { addMeasurement } = await import('@cornerstonejs/tools');
    const measurementService = await import('@ohif/core').then(m => m.servicesManager.services.measurementService);

    if (measurementService) {
      await measurementService.add(measurementData, { viewportId });
    } else {
      // Fallback to direct cornerstone tools
      addMeasurement(measurementData);
    }

    uiNotificationService.show({
      title: 'Bidirectional Measurement',
      message: 'Bidirectional measurement created from segment statistics',
      type: 'success',
      duration: 3000,
    });

  } catch (error: any) {
    if (error.message.includes('No suitable viewport found')) {
      uiNotificationService.show({
        title: 'Segment Bidirectional',
        message: 'Measurement created, but no suitable viewport was found to display it.',
        type: 'info',
      });
    } else {
      console.error('Error running Segment Bidirectional:', error);
      uiNotificationService.show({
        title: 'Segment Bidirectional',
        message:
          'Could not compute bidirectional data for the segment. The segmented area may be too small.',
        type: 'error',
      });
    }
  }
}
