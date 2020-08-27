import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import * as dcmjs from 'dcmjs';

const { globalImageIdSpecificToolStateManager } = cornerstoneTools;

export default function loadSegmentation(segBuffer) {
  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();
  const imageIds = Object.keys(globalToolState);

  debugger;

  debugger;

  // TODO -> Need to read through this more manually.

  // We can assume the seg is saved in the same orientation at the source volume since we are creating it.

  // Read each segment frame and make an ROI.

  const {
    labelmapBuffer,
    segMetadata,
    segmentsOnFrame,
  } = dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
    imageIds,
    segBuffer,
    cornerstone.metaData
  );

  debugger;
}
