import cornerstoneTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';

import Polygon from '../classes/Polygon.js';
import generateUID from '../generateUID.js';
import generateInterpolationData from './generateInterpolationData.js';

const { globalImageIdSpecificToolStateManager, store } = cornerstoneTools;

const triggerEvent = cornerstoneTools.importInternal('util/triggerEvent');

const { FREEHAND_ROI_3D_TOOL } = TOOL_NAMES;

const globalToolStateManager = globalImageIdSpecificToolStateManager;
const dP = 0.2; // Aim for < 0.2mm between interpolated nodes when super-sampling.
const modules = store.modules;

/**
 * interpolate - Interpolate missing contours in the ROIContour.
 *
 * @param  {object} toolData The tool data of the freehand3D contour.
 * @return {null}
 */
export default function(toolData, element) {
  const { ROIContourData, interpolationList } = generateInterpolationData(
    toolData,
    element
  );

  for (let i = 0; i < interpolationList.length; i++) {
    if (interpolationList[i]) {
      _linearlyInterpolateBetween(
        interpolationList[i].list,
        interpolationList[i].pair,
        ROIContourData
      );
    }
  }

  triggerEvent(element, 'peppermintinterpolateevent', {});
}

/**
 * _linearlyInterpolateBetween - Linearly interpolate all the slices in the
 * indicies array between the contourPair.
 *
 * @param  {Number[]} indicies     An array of slice indicies to interpolate.
 * @param  {Number[]} contourPair  The pair of contours to interpolate between.
 * @param  {object[]} ROIContourData  Data for the slice location of contours
 *                                    for the ROIContour.
 * @return {null}
 */

function _linearlyInterpolateBetween(indicies, contourPair, ROIContourData) {
  const c1 = _generateClosedContour(
    ROIContourData[contourPair[0]].contours[0].handles.points
  );
  const c2 = _generateClosedContour(
    ROIContourData[contourPair[1]].contours[0].handles.points
  );

  const { c1Interp, c2Interp } = _generateInterpolationContourPair(c1, c2);

  // Using the newly constructed contours, interpolate each ROI.
  indicies.forEach(function(index) {
    _linearlyInterpolateContour(
      c1Interp,
      c2Interp,
      index,
      contourPair,
      ROIContourData,
      c1.x.length > c2.x.length
    );
  });
}

/**
 * _linearlyInterpolateContour - Inserts a linearly interpolated contour at
 * specified slice index.
 *
 * @param  {object} c1Interp       The first reference contour.
 * @param  {object} c2Interp       The second reference contour.
 * @param  {Number} sliceIndex       The slice index to interpolate.
 * @param  {Number{}} contourPair    The slice indicies of the reference contours.
 * @param  {object[]} ROIContourData  Data for the slice location of contours
 *                                  for the ROIContour.
 * @param  {boolean} c1HasMoreNodes True if c1 has more nodes than c2.
 * @return {null}
 */
function _linearlyInterpolateContour(
  c1Interp,
  c2Interp,
  sliceIndex,
  contourPair,
  ROIContourData,
  c1HasMoreNodes
) {
  const zInterp =
    (sliceIndex - contourPair[0]) / (contourPair[1] - contourPair[0]);
  const interpolated2DContour = _generateInterpolatedOpenContour(
    c1Interp,
    c2Interp,
    zInterp,
    c1HasMoreNodes
  );

  const c1Metadata = ROIContourData[contourPair[0]].contours[0];

  if (ROIContourData[sliceIndex].contours) {
    _editInterpolatedContour(
      interpolated2DContour,
      ROIContourData[sliceIndex].imageId,
      c1Metadata
    );
  } else {
    _addInterpolatedContour(
      interpolated2DContour,
      ROIContourData[sliceIndex].imageId,
      c1Metadata
    );
  }
}

/**
 * _generateInterpolationContourPair - generates two aligned contours with an
 * equal number of nodes from which an intermediate contour may be interpolated.
 *
 * @param  {object} c1 The first contour.
 * @param  {object} c2 The second contour.
 * @return {object}  An object containing the two contours.
 */
function _generateInterpolationContourPair(c1, c2) {
  const cumPerim1 = _getCumulativePerimeter(c1);
  const cumPerim2 = _getCumulativePerimeter(c2);

  const interpNodes = Math.max(
    Math.ceil(cumPerim1[cumPerim1.length - 1] / dP),
    Math.ceil(cumPerim2[cumPerim2.length - 1] / dP)
  );

  const cumPerim1Norm = _normalisedCumulativePerimeter(cumPerim1);
  const cumPerim2Norm = _normalisedCumulativePerimeter(cumPerim2);

  const numNodes1 = interpNodes + c2.x.length;
  const numNodes2 = interpNodes + c1.x.length;

  // concatinate p && cumPerimNorm
  const perim1Interp = _getInterpolatedPerim(numNodes1, cumPerim1Norm);
  const perim2Interp = _getInterpolatedPerim(numNodes2, cumPerim2Norm);

  const perim1Ind = _getIndicatorArray(c1, numNodes1);
  const perim2Ind = _getIndicatorArray(c2, numNodes2);

  const nodesPerSegment1 = _getNodesPerSegment(perim1Interp, perim1Ind);
  const nodesPerSegment2 = _getNodesPerSegment(perim2Interp, perim2Ind);

  const c1i = _getSuperSampledContour(c1, nodesPerSegment1);
  const c2i = _getSuperSampledContour(c2, nodesPerSegment2);

  // Keep c2i fixed and shift the starting node of c1i to minimise the total length of segments.
  _shiftSuperSampledContourInPlace(c1i, c2i);

  return _reduceContoursToOriginNodes(c1i, c2i);
}

/**
 * _addInterpolatedContour - Adds a new contour to the imageId.
 *
 * @param  {object} interpolated2DContour The polygon to add to the ROIContour.
 * @param  {String} imageId               The imageId to add the polygon to.
 * @param  {type} referencedToolData    The toolData of another polygon in the
 * ROIContour, to assign appropriate metadata to the new polygon.
 * @return {null}
 */
function _addInterpolatedContour(
  interpolated2DContour,
  imageId,
  referencedToolData
) {
  const points = [];

  for (let i = 0; i < interpolated2DContour.x.length; i++) {
    points.push({
      x: interpolated2DContour.x[i],
      y: interpolated2DContour.y[i],
    });
  }

  const polygon = new Polygon(
    points,
    null,
    referencedToolData.seriesInstanceUid,
    referencedToolData.structureSetUid,
    referencedToolData.ROIContourUid,
    generateUID(),
    null,
    true
  );

  const toolStateManager = globalToolStateManager.saveToolState();

  if (!toolStateManager[imageId]) {
    toolStateManager[imageId] = {};
  }

  const imageToolState = toolStateManager[imageId];

  if (!imageToolState[FREEHAND_ROI_3D_TOOL]) {
    imageToolState[FREEHAND_ROI_3D_TOOL] = {};
    imageToolState[FREEHAND_ROI_3D_TOOL].data = [];
  } else if (!imageToolState[FREEHAND_ROI_3D_TOOL].data) {
    imageToolState[FREEHAND_ROI_3D_TOOL].data = [];
  }

  imageToolState[FREEHAND_ROI_3D_TOOL].data.push(
    polygon.getFreehandToolData(false)
  );

  modules.freehand3D.setters.incrementPolygonCount(
    referencedToolData.seriesInstanceUid,
    referencedToolData.structureSetUid,
    referencedToolData.ROIContourUid
  );
}

/**
 * _editInterpolatedContour - Edits an interpolated polygon on the imageId
 * that corresponds to the specified ROIContour.
 *
 * @param  {object} interpolated2DContour The polygon to add to the ROIContour.
 * @param  {String} imageId               The imageId to add the polygon to.
 * @param  {type} referencedToolData    The toolData of another polygon in the
 * ROIContour, to assign appropriate metadata to the new polygon.
 * @return {null}
 */
function _editInterpolatedContour(
  interpolated2DContour,
  imageId,
  referencedToolData
) {
  const toolStateManager = globalToolStateManager.saveToolState();
  const imageToolState = toolStateManager[imageId];

  if (!imageToolState) {
    throw new Error(
      'Image toolstate does not exist. This should not be reached in this case!'
    );
  }

  // Find the index of the polygon on this slice corresponding to
  // The ROIContour.
  let toolDataIndex;

  for (let i = 0; i < imageToolState[FREEHAND_ROI_3D_TOOL].data.length; i++) {
    if (
      imageToolState[FREEHAND_ROI_3D_TOOL].data[i].ROIContourUid ===
      referencedToolData.ROIContourUid
    ) {
      toolDataIndex = i;
      break;
    }
  }

  const oldPolygon = imageToolState[FREEHAND_ROI_3D_TOOL].data[toolDataIndex];
  const points = [];

  for (let i = 0; i < interpolated2DContour.x.length; i++) {
    points.push({
      x: interpolated2DContour.x[i],
      y: interpolated2DContour.y[i],
    });
  }

  const updatedPolygon = new Polygon(
    points,
    null,
    oldPolygon.seriesInstanceUid,
    oldPolygon.structureSetUid,
    oldPolygon.ROIContourUid,
    oldPolygon.uid,
    null,
    true
  );

  imageToolState[FREEHAND_ROI_3D_TOOL].data[
    toolDataIndex
  ] = updatedPolygon.getFreehandToolData(false);
}

/**
 * _generateInterpolatedOpenContour - Interpolate an open contour between c1ir
 * and c2ir at the zInterp position.
 *
 * @param  {object} c1ir            The interpolated c1 contour with
 *                                  superfluous nodes removed.
 * @param  {object} c2ir            The interpolated c2 contour with
 *                                  superfluous nodes removed.
 * @param  {Number} zInterp         The z- coordinate of the desired
 *                                  interpolation.
 * @param  {boolean} c1HasMoreNodes True if c1 has more original nodes
 *                                  than c2.
 * @return {object}                 The interpolated contour at z=zInterp.
 */
function _generateInterpolatedOpenContour(c1ir, c2ir, zInterp, c1HasMoreNodes) {
  const cInterp = {
    x: [],
    y: [],
  };

  const indicies = c1HasMoreNodes ? c1ir.I : c2ir.I;

  for (let i = 0; i < c1ir.x.length; i++) {
    if (indicies[i]) {
      cInterp.x.push((1 - zInterp) * c1ir.x[i] + zInterp * c2ir.x[i]);
      cInterp.y.push((1 - zInterp) * c1ir.y[i] + zInterp * c2ir.y[i]);
    }
  }

  return cInterp;
}

/**
 * _reduceContoursToOriginNodes - Removes any nodes from the contours that don't
 * correspond to an original contour node.
 *
 * @param  {object} c1i The first super-sampled contour.
 * @param  {object} c2i The second super-sampled contour.
 * @return {object}     An object containing the two reduced contours.
 */
function _reduceContoursToOriginNodes(c1i, c2i) {
  const c1Interp = {
    x: [],
    y: [],
    I: [],
  };
  const c2Interp = {
    x: [],
    y: [],
    I: [],
  };

  for (let i = 0; i < c1i.x.length; i++) {
    if (c1i.I[i] || c2i.I[i]) {
      c1Interp.x.push(c1i.x[i]);
      c1Interp.y.push(c1i.y[i]);
      c1Interp.I.push(c1i.I[i]);

      c2Interp.x.push(c2i.x[i]);
      c2Interp.y.push(c2i.y[i]);
      c2Interp.I.push(c2i.I[i]);
    }
  }

  return {
    c1Interp,
    c2Interp,
  };
}

/**
 * _shiftSuperSampledContourInPlace - Shifts the indicies of c1i around to
 * minimise: SUM (|c1i[i]-c2i[i]|) from 0 to N.
 *
 * @param  {object} c1i The contour to shift.
 * @param  {object} c2i The reference contour.
 * @modifies c1i
 */
function _shiftSuperSampledContourInPlace(c1i, c2i) {
  const c1iLength = c1i.x.length;

  let optimal = {
    startingNode: 0,
    totalSquaredXYLengths: Infinity,
  };

  for (let startingNode = 0; startingNode < c1iLength; startingNode++) {
    let node = startingNode;

    // NOTE: 1) Ignore calculating Z, as the sum of all squared Z distances will always be a constant.
    // NOTE: 2) Don't need actual length, so don't worry about square rooting.
    let totalSquaredXYLengths = 0;

    for (let itteration = 0; itteration < c1iLength; itteration++) {
      totalSquaredXYLengths +=
        (c1i.x[node] - c2i.x[itteration]) ** 2 +
        (c1i.y[node] - c2i.y[itteration]) ** 2;

      node++;

      if (node === c1iLength) node = 0;
    }

    if (totalSquaredXYLengths < optimal.totalSquaredXYLengths) {
      optimal.totalSquaredXYLengths = totalSquaredXYLengths;
      optimal.startingNode = startingNode;
    }
  }

  let node = optimal.startingNode;

  _shiftCircularArray(c1i.x, node);
  _shiftCircularArray(c1i.y, node);
  _shiftCircularArray(c1i.I, node);
}

/**
 * _shiftCircularArray - Shift the circular array by the count.
 *
 * @param  {*[]} arr   The array.
 * @param  {Number} count The shift.
 * @return {*[]}       The shifted array.
 */
function _shiftCircularArray(arr, count) {
  count -= arr.length * Math.floor(count / arr.length);
  arr.push.apply(arr, arr.splice(0, count));
  return arr;
}

/**
 * _getSuperSampledContour - Generates a super sampled contour with additional
 * nodes added per segment.
 *
 * @param  {object} c                 The original contour.
 * @param  {Number[]} nodesPerSegment An array of the number of nodes to add
 *                                    per line segment.
 * @return {object}                   The super sampled contour.
 */
function _getSuperSampledContour(c, nodesPerSegment) {
  const ci = {
    x: [],
    y: [],
    I: [],
  };

  // Length - 1, produces 'open' polygon.
  for (let n = 0; n < c.x.length - 1; n++) {
    // Add original node.
    ci.x.push(c.x[n]);
    ci.y.push(c.y[n]);
    ci.I.push(true);

    // Add linerally interpolated nodes.
    const xSpacing = (c.x[n + 1] - c.x[n]) / (nodesPerSegment[n] + 1);
    const ySpacing = (c.y[n + 1] - c.y[n]) / (nodesPerSegment[n] + 1);

    // Add other nodesPerSegment - 1 other nodes (as already put in original node).
    for (let i = 0; i < nodesPerSegment[n] - 1; i++) {
      ci.x.push(ci.x[ci.x.length - 1] + xSpacing);
      ci.y.push(ci.y[ci.y.length - 1] + ySpacing);
      ci.I.push(false);
    }
  }

  return ci;
}

/**
 * _getNodesPerSegment - Returns an array of the number of interpolated nodes
 * to be added along each line segment of a polygon.
 *
 * @param  {Number[]} perimInterp Normalised array of original and added nodes.
 * @param  {boolean[]} perimInd    The indicator array describing the location of
 *                            the original contour's nodes.
 * @return {Number[]}         An array containging the number of nodes to be
 *                            added per original line segment.
 */
function _getNodesPerSegment(perimInterp, perimInd) {
  const idx = [];

  for (let i = 0; i < perimInterp.length; ++i) idx[i] = i;
  idx.sort(function(a, b) {
    return perimInterp[a] < perimInterp[b]
      ? -1
      : perimInterp[a] > perimInterp[b];
  });

  const perimIndSorted = [];

  for (let i = 0; i < perimInd.length; i++) {
    perimIndSorted.push(perimInd[idx[i]]);
  }

  const indiciesOfOriginNodes = perimIndSorted.reduce(function(
    arr,
    elementValue,
    i
  ) {
    if (elementValue) arr.push(i);
    return arr;
  },
  []);

  const nodesPerSegment = [];

  for (let i = 0; i < indiciesOfOriginNodes.length - 1; i++) {
    nodesPerSegment.push(
      indiciesOfOriginNodes[i + 1] - indiciesOfOriginNodes[i]
    );
  }

  return nodesPerSegment;
}

/**
 * _getIndicatorArray - Produces an array of the location of the original nodes
 * in a super sampled contour.
 *
 * @param  {object} contour   The original contour.
 * @param  {Number} numNodes The number of nodes added.
 * @return {boolean[]}           The indicator array of original node locations.
 */
function _getIndicatorArray(contour, numNodes) {
  const perimInd = [];

  for (let i = 0; i < numNodes - 2; i++) {
    perimInd.push(false);
  }

  for (let i = 0; i < contour.x.length; i++) {
    perimInd.push(true);
  }

  return perimInd;
}

/**
 * _getInterpolatedPerim - Adds additional interpolated nodes to the
 * normalised perimeter array.
 *
 * @param  {Number} numNodes    The number of nodes to add.
 * @param  {Number[]} cumPerimNorm The cumulative perimeter array.
 * @return {Number[]}              The array of nodes.
 */
function _getInterpolatedPerim(numNodes, cumPerimNorm) {
  const diff = 1 / (numNodes - 1);
  const linspace = [diff];

  // Length - 2 as we are discarding 0 an 1 for efficiency (no need to calculate them).
  for (let i = 1; i < numNodes - 2; i++) {
    linspace.push(linspace[linspace.length - 1] + diff);
  }

  return linspace.concat(cumPerimNorm);
}

/**
 * _getCumulativePerimeter - Returns an array of the the cumulative perimeter at
 * each node of the contour.
 *
 * @param  {object} contour The contour.
 * @return {Number[]}         An array of the cumulative perimeter at each node.
 */
function _getCumulativePerimeter(contour) {
  let cumulativePerimeter = [0];

  for (let i = 1; i < contour.x.length; i++) {
    const lengthOfSegment = Math.sqrt(
      (contour.x[i] - contour.x[i - 1]) ** 2 +
        (contour.y[i] - contour.y[i - 1]) ** 2
    );

    cumulativePerimeter.push(cumulativePerimeter[i - 1] + lengthOfSegment);
  }

  return cumulativePerimeter;
}

/**
 * _normalisedCumulativePerimeter - Normalises the cumulative perimeter array.
 *
 * @param  {type} cumPerim An array of the cumulative perimeter at each of a
 * contour.
 * @return {type}          The normalised array.
 */
function _normalisedCumulativePerimeter(cumPerim) {
  const cumPerimNorm = [];

  for (let i = 0; i < cumPerim.length; i++) {
    cumPerimNorm.push(cumPerim[i] / cumPerim[cumPerim.length - 1]);
  }

  return cumPerimNorm;
}

/**
 * _generateClosedContour - Generate a clockwise contour object from the points
 * of a clockwise or anti-clockwise polygon.
 *
 * @param  {object[]} points The points to generate the contour from.
 * @return {object}           The generated contour object.
 */
function _generateClosedContour(points) {
  const c = {
    x: [],
    y: [],
  };

  // NOTE: For z positions we only need the relative difference for interpolation, thus use frame index as Z.
  for (let i = 0; i < points.length; i++) {
    c.x[i] = points[i].x;
    c.y[i] = points[i].y;
  }

  // Push last node to create closed contour.
  c.x.push(c.x[0]);
  c.y.push(c.y[0]);

  _reverseIfAntiClockwise(c);

  return c;
}

/**
 * _reverseIfAntiClockwise - If the contour's nodes run anti-clockwise,
 * reverse them.
 *
 * @param  {object} contour The contour.
 * @return {object}         The contour, corrected to be clockwise if appropriate.
 */
function _reverseIfAntiClockwise(contour) {
  const length = contour.x.length;
  const contourXMean = contour.x.reduce(getSumReducer) / length;
  let checkSum = 0;

  for (let k = 0, i = 1, j = 2; k < length; k++) {
    checkSum += (contour.x[i] - contourXMean) * (contour.y[j] - contour.y[k]);
    i++;
    j++;
    if (i >= length) i = 0;
    if (j >= length) j = 0;
  }

  if (checkSum > 0) {
    contour.x.reverse();
    contour.y.reverse();
  }
}

/**
 * getSumReducer - A reducer function that calculates the sum of an array.
 *
 * @param  {Number} total The running total.
 * @param  {Number} num   The numerical value of the array element.
 * @return {Number}       The updated running total.
 */
function getSumReducer(total, num) {
  return total + num;
}
