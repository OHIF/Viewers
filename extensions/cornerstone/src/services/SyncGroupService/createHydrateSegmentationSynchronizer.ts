import { Enums as CoreEnums, Types, getEnabledElementByViewportId } from '@cornerstonejs/core';
import {
  SynchronizerManager,
  Synchronizer,
  Enums,
  Types as ToolsTypes,
} from '@cornerstonejs/tools';

import { isAnyDisplaySetCommon } from '../../utils/isAnyDisplaySetCommon';

const { createSynchronizer } = SynchronizerManager;
const { SEGMENTATION_REPRESENTATION_MODIFIED } = Enums.Events;
const { BlendModes } = CoreEnums;

export default function createHydrateSegmentationSynchronizer(
  synchronizerName: string,
  { servicesManager, ...options }: { servicesManager: AppTypes.ServicesManager; options }
): Synchronizer {
  const stackImageSynchronizer = createSynchronizer(
    synchronizerName,
    SEGMENTATION_REPRESENTATION_MODIFIED,
    (synchronizerInstance, sourceViewport, targetViewport, sourceEvent) => {
      return segmentationRepresentationModifiedCallback(
        synchronizerInstance,
        sourceViewport,
        targetViewport,
        sourceEvent,
        { servicesManager, options }
      );
    },
    {
      eventSource: 'eventTarget',
    }
  );

  return stackImageSynchronizer;
}

/**
 * This method will add the segmentation representation to any target viewports having:
 *
 * 1. the same FrameOfReferenceUID (FOR) as the segmentation representation, or
 * 2. a shared DisplaySet with the source viewport when no FOR is present.
 */
const segmentationRepresentationModifiedCallback = async (
  synchronizerInstance: Synchronizer,
  sourceViewport: Types.IViewportId,
  targetViewport: Types.IViewportId,
  sourceEvent: Event,
  { servicesManager, options }: { servicesManager: AppTypes.ServicesManager; options: unknown }
) => {
  const event = sourceEvent as ToolsTypes.EventTypes.SegmentationRepresentationModifiedEventType;

  const { segmentationId, type: segmentationRepresentationType } = event.detail;
  const { segmentationService, cornerstoneViewportService } = servicesManager.services;

  const targetViewportId = targetViewport.viewportId;
  const sourceViewportId = sourceViewport.viewportId;

  const { viewport } = getEnabledElementByViewportId(targetViewportId);
  const sourceViewportInfo = cornerstoneViewportService.getViewportInfo(sourceViewportId);
  const targetViewportInfo = cornerstoneViewportService.getViewportInfo(targetViewportId);

  const sourceDisplaySetUIDs = extractDisplaySetUIDs(sourceViewportInfo);
  const targetDisplaySetUIDs = extractDisplaySetUIDs(targetViewportInfo);

  const sharedDisplaySetExists = isAnyDisplaySetCommon(sourceDisplaySetUIDs, targetDisplaySetUIDs);

  if (!sharedDisplaySetExists && !viewport.getFrameOfReferenceUID()) {
    return;
  }

  const targetViewportRepresentation = segmentationService.getSegmentationRepresentations(
    targetViewportId,
    { segmentationId }
  );

  if (targetViewportRepresentation.length > 0) {
    return;
  }

  // Ensure the segmentation representation aligns with the target viewport type.
  const type: Enums.SegmentationRepresentations =
    viewport.type === CoreEnums.ViewportType.VOLUME_3D
      ? Enums.SegmentationRepresentations.Surface
      : ((segmentationRepresentationType as Enums.SegmentationRepresentations) ??
        Enums.SegmentationRepresentations.Labelmap);

  await segmentationService.addSegmentationRepresentation(targetViewportId, {
    segmentationId,
    type,
    config: {
      blendMode:
        viewport.getBlendMode() === 1 ? BlendModes.LABELMAP_EDGE_PROJECTION_BLEND : undefined,
    },
  });
};

/**
 * Extracts the displaySetInstanceUIDs from a viewportInfo.
 */
function extractDisplaySetUIDs(viewportInfo) {
  return viewportInfo.getViewportData().data.map(ds => ds.displaySetInstanceUID);
}
