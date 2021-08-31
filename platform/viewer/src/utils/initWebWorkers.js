import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

let initialized = false;

const MAX_CONCURRENCY = 6;

export default function initWebWorkers() {
  const config = {
    maxWebWorkers: Math.max(Math.min(navigator.hardwareConcurrency - 1, MAX_CONCURRENCY), 1),
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        usePDFJS: false,
        strict: false,
      },
    },
  };

  if (!initialized) {
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
    initialized = true;
  }
}
