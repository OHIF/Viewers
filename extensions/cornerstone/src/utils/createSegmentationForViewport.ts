import { utilities as csUtils } from '@cornerstonejs/core';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import i18n from '@ohif/i18n';
import { ServicesManager } from '@ohif/core';

/**
 * Creates a segmentation for the active viewport
 *
 * The created segmentation will be registered as a display set and also added
 * as a segmentation representation to the viewport.
 */
export async function createSegmentationForViewport(
  servicesManager: ServicesManager,
  {
    viewportId,
    options = {},
    segmentationType,
  }: {
    viewportId: string;
    options?: {
      displaySetInstanceUID?: string;
      label?: string;
      segmentationId?: string;
      createInitialSegment?: boolean;
    };
    segmentationType: SegmentationRepresentations;
  }
) {
  const { viewportGridService, displaySetService, segmentationService } = servicesManager.services;
  const { viewports } = viewportGridService.getState();
  const targetViewportId = viewportId;

  const viewport = viewports.get(targetViewportId);

  // Todo: add support for multiple display sets
  const displaySetInstanceUID = options.displaySetInstanceUID || viewport.displaySetInstanceUIDs[0];

  const segs = segmentationService.getSegmentations();

  const label = options.label || `Segmentation ${segs.length + 1}`;
  const segmentationId = options.segmentationId || `${csUtils.uuidv4()}`;

  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

  // This will create the segmentation and register it as a display set
  const generatedSegmentationId = await (segmentationType === SegmentationRepresentations.Labelmap
    ? segmentationService.createLabelmapForDisplaySet(displaySet, {
        label,
        segmentationId,
        segments: options.createInitialSegment
          ? {
              1: {
                label: `${i18n.t('Segment')} 1`,
                active: true,
              },
            }
          : {},
      })
    : segmentationService.createContourForDisplaySet(displaySet, {
        label,
        segmentationId,
        segments: options.createInitialSegment
          ? {
              1: {
                label: `${i18n.t('Segment')} 1`,
                active: true,
              },
            }
          : {},
      }));

  // Also add the segmentation representation to the viewport
  await segmentationService.addSegmentationRepresentation(viewportId, {
    segmentationId,
    type: segmentationType,
  });

  return generatedSegmentationId;
}
