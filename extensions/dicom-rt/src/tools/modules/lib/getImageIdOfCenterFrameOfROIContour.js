import cornerstoneTools from 'cornerstone-tools';
import TOOL_NAMES from '../../../utils/toolNames';

const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * getImageIdOfCenterFrameOfROIContour - Returns the imageId nearest to the center of the
 * volumes extent in the stack's Z direction which contains one of the ROIContour's Contours.
 * @param {string} structureSetSeriesInstanceUid The SeriesInstanceUID of the structure set.
 * @param {number} ROINumber The ROINumber of the region.
 * @param {string} imageIdsInStack The stack of imageIds.
 *
 * @returns The imageId
 */
export default function getImageIdOfCenterFrameOfROIContour(
  structureSetSeriesInstanceUid,
  ROINumber,
  imageIdsInStack
) {
  const rtStructDisplayToolName = TOOL_NAMES.RTSTRUCT_DISPLAY_TOOL;
  const toolState = globalImageIdSpecificToolStateManager.saveToolState();
  const imageIdIndicies = [];

  for (let i = 0; i < imageIdsInStack.length; i++) {
    const imageId = imageIdsInStack[i];

    const imageIdSpecificToolState = toolState[imageId];

    if (
      !imageIdSpecificToolState ||
      !imageIdSpecificToolState[rtStructDisplayToolName] ||
      !imageIdSpecificToolState[rtStructDisplayToolName].data
    ) {
      continue;
    }

    const toolData = imageIdSpecificToolState[rtStructDisplayToolName].data;

    if (
      _toolDataContainsROIContour(
        toolData,
        structureSetSeriesInstanceUid,
        ROINumber
      )
    ) {
      imageIdIndicies.push(i);
    }
  }

  const centerImageIdIndex =
    imageIdIndicies[Math.floor(imageIdIndicies.length / 2)];

  return imageIdsInStack[centerImageIdIndex];
}

function _toolDataContainsROIContour(
  toolData,
  structureSetSeriesInstanceUid,
  ROINumber
) {
  return !!toolData.some(
    toolDataI =>
      toolDataI.structureSetSeriesInstanceUid ===
        structureSetSeriesInstanceUid && toolDataI.ROINumber === ROINumber
  );
}
