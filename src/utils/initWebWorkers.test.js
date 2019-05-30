import initWebWorkers from './initWebWorkers.js';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

describe('initWebWorkers', () => {
  it("initializes cornerstoneWADOImageLoader's web workers", () => {
    const basePath = '/';
    const relativeWebWorkerScriptsPath = '';

    initWebWorkers(basePath, relativeWebWorkerScriptsPath);

    expect(
      cornerstoneWADOImageLoader.webWorkerManager.initialize
    ).toHaveBeenCalled();
  });
});
