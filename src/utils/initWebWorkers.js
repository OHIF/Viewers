import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

/**
 *
 * @param {String} baseDirectory
 * @param {String} webWorkScriptsPath
 */
export default function(baseDirectory, webWorkScriptsPath) {
  const scriptsPath = `${window.location.protocol}//${
    window.location.host
  }${baseDirectory}/${webWorkScriptsPath}`;
  const config = {
    maxWebWorkers: Math.max(navigator.hardwareConcurrency - 1, 1),
    startWebWorkersOnDemand: true,
    webWorkerPath: `${scriptsPath}/cornerstoneWADOImageLoaderWebWorker.min.js`,
    taskConfiguration: {
      decodeTask: {
        loadCodecsOnStartup: true,
        initializeCodecsOnStartup: false,
        codecsPath: `${scriptsPath}/cornerstoneWADOImageLoaderCodecs.min.js`,
        usePDFJS: false,
        strict: false,
      },
    },
  };

  cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
}
