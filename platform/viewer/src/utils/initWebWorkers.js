import { getCornerstoneWADOImageLoader } from './cornerstoneWADOImageLoader';
let initialized = false;

export default function initWebWorkers() {
  const config = {
    maxWebWorkers: Math.max(navigator.hardwareConcurrency - 1, 1),
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        usePDFJS: false,
        strict: false,
      },
    },
  };

  getCornerstoneWADOImageLoader().then(cornerstoneWADOImageLoader => {
    if (!initialized) {
      cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
      initialized = true;
    }
  });
}
