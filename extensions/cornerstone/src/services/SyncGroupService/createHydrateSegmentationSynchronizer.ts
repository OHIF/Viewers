import { Types, getEnabledElementByViewportId } from '@cornerstonejs/core';
import {
  SynchronizerManager,
  Synchronizer,
  Enums,
  Types as ToolsTypes,
} from '@cornerstonejs/tools';

const { createSynchronizer } = SynchronizerManager;
const { SEGMENTATION_REPRESENTATION_ADDED } = Enums.Events;

export default function createHydrateSegmentationSynchronizer(
  synchronizerName: string,
  { servicesManager, ...options }: { servicesManager: AppTypes.ServicesManager; options }
): Synchronizer {
  const stackImageSynchronizer = createSynchronizer(
    synchronizerName,
    SEGMENTATION_REPRESENTATION_ADDED,
    (synchronizerInstance, sourceViewport, targetViewport, sourceEvent) =>
      segmentationRepresentationModifiedCallback(
        synchronizerInstance,
        sourceViewport,
        targetViewport,
        sourceEvent,
        { servicesManager, options }
      ),
    {
      eventSource: 'eventTarget',
    }
  );

  return stackImageSynchronizer;
}

const segmentationRepresentationModifiedCallback = async (
  synchronizerInstance: Synchronizer,
  sourceViewport: Types.IViewportId,
  targetViewport: Types.IViewportId,
  sourceEvent: Event,
  { servicesManager, options }: { servicesManager: AppTypes.ServicesManager; options: unknown }
) => {
  const event = sourceEvent as ToolsTypes.EventTypes.SegmentationRepresentationModifiedEventType;

  const { segmentationId, viewportId } = event.detail;
  const { segmentationService, hangingProtocolService } = servicesManager.services;

  const targetViewportId = targetViewport.viewportId;

  const { viewport } = getEnabledElementByViewportId(targetViewportId);

  const targetFrameOfReferenceUID = viewport.getFrameOfReferenceUID();

  if (!targetFrameOfReferenceUID) {
    console.debug('No frame of reference UID found for the target viewport');
    return;
  }

  const targetViewportRepresentation = segmentationService.getSegmentationRepresentations(
    targetViewportId,
    { segmentationId }
  );

  if (targetViewportRepresentation.length > 0) {
    return;
  }

  // whatever type the source viewport has, we need to add that to the target viewport
  const sourceViewportRepresentation = segmentationService.getSegmentationRepresentations(
    sourceViewport.viewportId,
    { segmentationId }
  );

  const type = sourceViewportRepresentation[0].type;

  await segmentationService.addSegmentationRepresentation(targetViewportId, {
    segmentationId,
    type,
  });
};
