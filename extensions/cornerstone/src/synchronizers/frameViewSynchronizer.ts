import { SynchronizerManager, Synchronizer, utilities } from '@cornerstonejs/tools';
import { EVENTS, getRenderingEngine, Types } from '@cornerstonejs/core';

const frameViewSyncCallback = (
  synchronizerInstance: Synchronizer,
  sourceViewport: Types.IViewportId,
  targetViewport: Types.IViewportId
) => {
  const renderingEngine = getRenderingEngine(targetViewport.renderingEngineId);
  if (!renderingEngine) {
    throw new Error(`No RenderingEngine for Id: ${targetViewport.renderingEngineId}`);
  }
  const sViewport = renderingEngine.getViewport(sourceViewport.viewportId) as Types.IStackViewport;

  const { viewportIndex: targetViewportIndex } = synchronizerInstance.getOptions(
    targetViewport.viewportId
  );

  const { viewportIndex: sourceViewportIndex } = synchronizerInstance.getOptions(
    sourceViewport.viewportId
  );

  if (targetViewportIndex === undefined || sourceViewportIndex === undefined) {
    throw new Error('No viewportIndex provided');
  }

  const tViewport = renderingEngine.getViewport(targetViewport.viewportId) as Types.IStackViewport;

  const sourceSliceIndex = sViewport.getSliceIndex();
  const sliceDifference = Number(targetViewportIndex) - Number(sourceViewportIndex);
  const targetSliceIndex = sourceSliceIndex + sliceDifference;

  if (targetSliceIndex === tViewport.getSliceIndex()) {
    return;
  }

  utilities.jumpToSlice(tViewport.element, {
    imageIndex: targetSliceIndex,
  });
};

const createFrameViewSynchronizer = (synchronizerName: string): Synchronizer => {
  const synchronizer = SynchronizerManager.createSynchronizer(
    synchronizerName,
    EVENTS.CAMERA_MODIFIED,
    frameViewSyncCallback
  );
  return synchronizer;
};

export { createFrameViewSynchronizer };
