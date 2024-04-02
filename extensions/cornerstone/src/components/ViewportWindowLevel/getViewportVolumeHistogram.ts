import { getWebWorkerManager } from '@cornerstonejs/core';

const workerManager = getWebWorkerManager();

const options = {
  // maxWorkerInstances: 1,
  // overwrite: false
  autoTerminationOnIdle: 1000,
};

// Register the task
const workerFn = () => {
  return new Worker(new URL('./histogramWOrker.js', import.meta.url), {
    name: 'histogram-worker', // name used by the browser to name the worker
  });
};

workerManager.registerWorker('histogram-worker', workerFn, options);

const getViewportVolumeHistogram = async (viewport, volume, options?) => {
  if (!volume?.loadStatus.loaded) {
    return undefined;
  }

  const volumeImageData = viewport.getImageData(volume.volumeId);

  if (!volumeImageData) {
    return undefined;
  }

  let scalarData = volume.scalarData;

  let prevTimePoint;
  if (volume.numTimePoints > 1) {
    prevTimePoint = volume.timePointIndex;
    const middleTimePoint = Math.round(volume.numTimePoints / 2);
    volume.timePointIndex = middleTimePoint;
    scalarData = volume.getScalarData(middleTimePoint);
  }

  const { dimensions, origin, direction, spacing } = volume;

  const range = await workerManager.executeTask('histogram-worker', 'getRange', {
    dimensions,
    origin,
    direction,
    spacing,
    scalarData,
  });

  // after we calculate the range let's reset the timePointIndex
  if (volume.numTimePoints > 1) {
    volume.timePointIndex = prevTimePoint;
  }
  const { minimum: min, maximum: max } = range;
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
