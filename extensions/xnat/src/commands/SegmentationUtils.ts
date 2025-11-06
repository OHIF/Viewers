/**
 * Segmentation utility functions
 * Extracted from segmentationCommands.ts
 */

export interface SegmentationUtilsParams {
  segmentationService: any;
  viewportGridService: any;
}

/**
 * Safe override of setActiveSegmentAndCenter that avoids crashes when segment center is undefined
 */
export function setActiveSegmentAndCenter(
  { segmentationId, segmentIndex }: { segmentationId: string; segmentIndex: number },
  { segmentationService, viewportGridService }: SegmentationUtilsParams
) {
  const viewportId = viewportGridService.getActiveViewportId();

  // Set both active segmentation and active segment
  segmentationService.setActiveSegmentation(viewportId, segmentationId);
  segmentationService.setActiveSegment(segmentationId, segmentIndex);

  // Safely attempt to jump to segment center, but catch any errors
  try {
    // Check if the segmentation and segment exist before attempting to jump
    const segmentation = segmentationService.getSegmentation(segmentationId);
    if (segmentation && segmentation.segments && segmentation.segments[segmentIndex]) {
      const segment = segmentation.segments[segmentIndex];
      // Only attempt jump if we have cached stats with center data
      if (segment.cachedStats && (segment.cachedStats.center || segment.cachedStats.namedStats?.center?.value)) {
        segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex);
      } else {
        console.log('XNAT: Segment center not available, skipping jump to center');
      }
    }
  } catch (error) {
    console.warn('XNAT: Error jumping to segment center:', error);
    // Continue without jumping - the segment is still activated
  }
}

/**
 * XNAT Import Segmentation command
 */
export async function XNATImportSegmentation(
  { arrayBuffer, studyInstanceUID, seriesInstanceUID, servicesManager }: {
    arrayBuffer: ArrayBuffer;
    studyInstanceUID: string;
    seriesInstanceUID: string;
    servicesManager: any;
  },
  { uiNotificationService }: { uiNotificationService: any }
) {
  const { importSegmentation } = await import('../utils/importSegmentation');

  try {
    const segmentationId = await importSegmentation({
      arrayBuffer,
      studyInstanceUID,
      seriesInstanceUID,
      servicesManager,
    });

    uiNotificationService.show({
      title: 'Import Successful',
      message: 'Segmentation imported successfully from XNAT',
      type: 'success',
      duration: 3000,
    });

    return segmentationId;
  } catch (error: any) {
    console.error('Error importing segmentation:', error);
    uiNotificationService.show({
      title: 'Import Failed',
      message: `Failed to import segmentation: ${error.message}`,
      type: 'error',
      duration: 5000,
    });
    throw error;
  }
}
