import initWebWorkers from './initWebWorkers.js';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

describe('initWebWorkers', () => {
  it("initializes cornerstoneWADOImageLoader's web workers", () => {
    initWebWorkers();

    expect(
      cornerstoneWADOImageLoader.webWorkerManager.initialize
    ).toHaveBeenCalled();
  });
});

describe('initWebWorkers', () => {
  it("initializes cornerstoneWADOImageLoader's web workers only once", () => {
    initWebWorkers();
    initWebWorkers();

    expect(
      cornerstoneWADOImageLoader.webWorkerManager.initialize
    ).toHaveBeenCalledTimes(1);
  });
});
