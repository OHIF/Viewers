import { cache } from '@cornerstonejs/core';

type CineState = {
  frameRate: number;
  isPlaying: boolean;
};

function getSyncedCineState(
  servicesManager,
  cines,
  srcViewportIndex
): CineState {
  const validViewportIndexes = new Set();
  const {
    viewportGridService,
    cornerstoneViewportService,
  } = servicesManager.services;

  const { viewports: viewportsStates } = viewportGridService.getState();
  const srcViewportState = viewportsStates.find(
    ({ viewportIndex }) => viewportIndex === srcViewportIndex
  );

  if (srcViewportState.viewportOptions.viewportType !== 'volume') {
    return;
  }

  const srcViewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
    srcViewportIndex
  );
  const defaultActor = srcViewport.getDefaultActor();

  if (!defaultActor) {
    return;
  }

  const { uid: srcVolumeId } = srcViewport.getDefaultActor();
  const srcVolume = cache.getVolume(srcVolumeId);

  // This only works for 4D volumes because Cine updates
  // all viewports at the same time
  if (!srcVolume?.isDynamicVolume()) {
    return;
  }

  // Get all viewports that contains the same volumeId loaded
  viewportsStates.forEach(({ viewportIndex }) => {
    const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
      viewportIndex
    );

    if (viewport?.hasVolumeId(srcVolumeId)) {
      validViewportIndexes.add(viewportIndex);
    }
  });

  const sortedCines = Object.keys(cines)
    .filter(key => validViewportIndexes.has(cines[key].id))
    .map(key => cines[key])
    .sort((left, right) => right.updateSeq - left.updateSeq);

  if (sortedCines.length) {
    const { frameRate, isPlaying } = sortedCines[0];
    return { frameRate, isPlaying };
  }
}

export default getSyncedCineState;
