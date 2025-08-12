import { SynchronizerManager, Synchronizer } from '@cornerstonejs/tools';
import { EVENTS, getRenderingEngine, type Types, utilities } from '@cornerstonejs/core';

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
    EVENTS.STACK_VIEWPORT_SCROLL,
    frameViewSyncCallback,
    { auxiliaryEvents: [{ name: EVENTS.CAMERA_MODIFIED, source: 'element' }] }
  );
  return synchronizer;
};

export { createFrameViewSynchronizer };
