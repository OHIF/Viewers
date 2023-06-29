// segmentationWorker.js

self.onmessage = function(e) {
  let { action, payload } = e.data;

  try {
    if (action === 'saveSegmentations') {
      let segList = payload;

      // Perform your saving operation here
      // This might be a heavy operation that you want to offload

      let result = {};
      self.postMessage({ status: 'success', data: result });
    }
  } catch (error) {
    // If an error happens, send the error message back to the main thread
    self.postMessage({ status: 'error', message: error.message });
  }
};
