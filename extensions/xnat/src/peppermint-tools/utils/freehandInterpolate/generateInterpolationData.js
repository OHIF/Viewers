import {
  globalImageIdSpecificToolStateManager,
  getToolState,
} from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';

const { FREEHAND_ROI_3D_TOOL } = TOOL_NAMES;

const globalToolStateManager = globalImageIdSpecificToolStateManager;

/**
 * generateInterpolationList - Generate the list of contours to interpolate,
 * including whether they are new contours, or interpolated contours that need
 * to be updated.
 *
 * @param  {object} toolData The tool data of the freehand3D contour.
 * @return {object} An object containing the ROIContourData and the
 * interpolationList.
 */
export default function(toolData, element) {
  const ROIContourUid = toolData.ROIContourUid;
  const imageIds = _getImageIdsOfActiveSeries(element);
  const ROIContourData = _getROIContourData(imageIds, ROIContourUid);
  const extent = _getExtentOfRegion(ROIContourData);
  const sliceEdited = _getSlicePositionOfToolData(ROIContourData, toolData.uid);
  const interpolationList = [];

  // Check if contours between the extent can be interpolated.
  for (let i = extent[0] + 1; i <= extent[1] - 1; i++) {
    if (_sliceNeedsInterpolating(ROIContourData, i)) {
      const contourPair = _getBoundingPair(i, extent, ROIContourData);

      if (
        contourPair &&
        (contourPair[0] === sliceEdited || contourPair[1] === sliceEdited)
      ) {
        _appendinterpolationList(contourPair, interpolationList, i);
      }
    }
  }

  return {
    ROIContourData,
    interpolationList,
  };
}

/**
 * _getSlicePositionOfToolData - Finds the slice that was edited.
 *
 * @param  {type} ROIContourData description
 * @param  {type} polygonUid     description
 * @return {type}                description
 */
function _getSlicePositionOfToolData(ROIContourData, polygonUid) {
  for (let i = 0; i < ROIContourData.length; i++) {
    if (ROIContourData[i].contours) {
      const contours = ROIContourData[i].contours;

      for (let j = 0; j < contours.length; j++) {
        if (contours[j].uid === polygonUid) {
          return i;
        }
      }
    }
  }

  return;
}

/**
 * _getImageIdsOfActiveSeries - returns an array of the imageIds for the current
 * active series.
 *
 * @return {String[]} An array of imageIds.
 */

function _getImageIdsOfActiveSeries(element) {
  const stackToolState = getToolState(element, 'stack');

  return stackToolState.data[0].imageIds;
}

/**
 * _getROIContourData - Generates a list of the slice locations of the 2D
 * polygons that make up the ROIContour.
 *
 * @param  {String[]} imageIds  An array of Image Ids.
 * @param  {type} ROIContourUid The UID of the ROIContour.
 * @return {object[]}           The list of contour locations in the stack.
 */

function _getROIContourData(imageIds, ROIContourUid) {
  const ROIContourData = [];
  const toolStateManager = globalToolStateManager.saveToolState();

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageToolState = toolStateManager[imageId];

    if (!imageToolState || !imageToolState[FREEHAND_ROI_3D_TOOL]) {
      ROIContourData.push({
        imageId,
      });
    } else {
      const contours = imageToolState[FREEHAND_ROI_3D_TOOL].data.filter(
        contour => {
          return contour.ROIContourUid === ROIContourUid;
        }
      );

      const contoursOnSlice = {
        imageId,
      };

      if (contours.length) {
        contoursOnSlice.contours = contours;
      }

      ROIContourData.push(contoursOnSlice);
    }
  }

  return ROIContourData;
}

/**
 * _getExtentOfRegion - Returns a 2 element array with the slice locations of
 * top and bottom polygon of the ROIContour.
 *
 * @param  {object} ROIContourData  Data on the slice location of contours
 *                                  for the ROIContour.
 * @return {Number[]}               The slice locations of the top and bottom
 *                                  polygon of the ROIContour.
 */

function _getExtentOfRegion(ROIContourData) {
  const extent = [];

  for (let i = 0; i < ROIContourData.length; i++) {
    if (ROIContourData[i].contours) {
      extent.push(i);
      break;
    }
  }

  for (let i = ROIContourData.length - 1; i >= 0; i--) {
    if (ROIContourData[i].contours) {
      extent.push(i);
      break;
    }
  }

  return extent;
}

/**
 * _sliceNeedsInterpolating - Check whether there are no contours on this
 * slice, or one which is an interpolated contour.
 *
 * @param  {object} ROIContourData  Data on the slice location of contours
 *                                  for the ROIContour.
 * @param  {Number} sliceIndex      The slice index.
 * @return {boolean}                Whether or not the slice needs interpolating.
 */
function _sliceNeedsInterpolating(ROIContourData, sliceIndex) {
  return (
    !ROIContourData[sliceIndex].contours ||
    (ROIContourData[sliceIndex].contours.length === 1 &&
      ROIContourData[sliceIndex].contours[0].interpolated)
  );
}

/**
 * _appendinterpolationList - If the contour on slice i can be updated, add it to the
 * interpolationList.
 *
 * @param  {Number} sliceIndex      The slice index.
 * @param  {Number[]} extent        The extent of slice occupancy of the
 *                                  ROIContour.
 * @param  {object[]} ROIContourData  Data for the slice location of contours
 *                                  for the ROIContour.
 * @param  {object[]} interpolationList The list of contours to be interpolated.
 * @return {null}
 */
function _appendinterpolationList(contourPair, interpolationList, i) {
  if (!interpolationList[contourPair[0]]) {
    interpolationList[contourPair[0]] = {
      pair: contourPair,
      list: [],
    };
  }

  interpolationList[contourPair[0]].list.push(i);
}

/**
 * _getBoundingPair - Given the slice index and extent of the ROIContour,
 * get the pair of polygons to use for interpolation of the slice. Returns
 * undefined if there is an ambiguity and interpolation can't take place.
 *
 * @param  {Number} sliceIndex   The slice index.
 * @param  {Number[]} extent        The extent of slice occupancy of the
 *                                  ROIContour.
 * @param  {object[]} ROIContourData  Data for the slice location of contours
 *                                  for the ROIContour.
 * @return {Number[] || undefined}  The pair of slice indicies, or undefined if
 * the contours to use for interpolation is ambiguous.
 */

function _getBoundingPair(sliceIndex, extent, ROIContourData) {
  let contourPair = [];
  let canInterpolate = true;

  // Check for nearest lowest sliceIndex containing contours.
  for (let i = sliceIndex - 1; i >= extent[0]; i--) {
    if (ROIContourData[i].contours) {
      const contours = ROIContourData[i].contours;

      if (contours[0].interpolated) {
        // This contour is interpolated. We need to
        // Find a solid contour to interpolate from.
        continue;
      }

      if (contours.length > 1) {
        canInterpolate = false;
      }

      // Found single, non interpolated contour to interpolate from.
      contourPair.push(i);
      break;
    }
  }

  if (!canInterpolate) {
    return;
  }

  // Check for nearest upper sliceIndex containing contours.
  for (let i = sliceIndex + 1; i <= extent[1]; i++) {
    if (ROIContourData[i].contours) {
      const contours = ROIContourData[i].contours;

      if (contours[0].interpolated) {
        // This contour is interpolated. We need to
        // Find a solid contour to interpolate from.
        continue;
      }

      if (contours.length > 1) {
        canInterpolate = false;
      }

      contourPair.push(i);
      break;
    }
  }

  if (!canInterpolate) {
    return;
  }

  return contourPair;
}
