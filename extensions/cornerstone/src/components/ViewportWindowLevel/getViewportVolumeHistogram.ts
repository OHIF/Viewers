import { getWebWorkerManager } from '@cornerstonejs/core';

const workerManager = getWebWorkerManager();

const WorkerOptions = {
  maxWorkerInstances: 1,
  autoTerminateOnIdle: {
    enabled: true,
    idleTimeThreshold: 1000,
  },
};

// Register the task
const workerFn = () => {
  return new Worker(new URL('./histogramWorker.js', import.meta.url), {
    name: 'histogram-worker', // name used by the browser to name the worker
  });
};

const getViewportVolumeHistogram = async (viewport, volume, options?) => {
  workerManager.registerWorker('histogram-worker', workerFn, WorkerOptions);

  const volumeImageData = viewport.getImageData(volume.volumeId);

  if (!volumeImageData) {
    return undefined;
  }

  let scalarData = volume.scalarData;

  if (volume.numTimePoints > 1) {
    const targetTimePoint = volume.numTimePoints - 1; // or any other time point you need
    scalarData = volume.voxelManager.getTimePointScalarData(targetTimePoint);
  } else {
    scalarData = volume.voxelManager.getCompleteScalarDataArray();
  }

  if (!scalarData?.length) {
    return undefined;
  }

  const { dimensions, origin, direction, spacing } = volume;

  const range = await workerManager.executeTask('histogram-worker', 'getRange', {
    dimensions,
    origin,
    direction,
    spacing,
    scalarData,
  });

  const { minimum: min, maximum: max } = range;

  if (min === Infinity || max === -Infinity) {
    return undefined;
  }

  const calcHistOptions = {
    numBins: 256,
    min: Math.max(min, options?.min ?? min),
    max: Math.min(max, options?.max ?? max),
  };

  const histogram = await workerManager.executeTask('histogram-worker', 'calcHistogram', {
    data: scalarData,
    options: calcHistOptions,
  });

  return histogram;
};

export { getViewportVolumeHistogram };
