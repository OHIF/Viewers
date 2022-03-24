import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import Brush3DTool from './Brush3DTool.js';
import floodFill from './n-dimensional-flood-fill.js';
import TOOL_NAMES from '../../toolNames';

const { EVENTS, importInternal } = cornerstoneTools;

const segmentationModule = cornerstoneTools.getModule('segmentation');
const { getCircle, drawBrushPixels } = importInternal('util/segmentationUtils');

export default class Brush3DHUGatedTool extends Brush3DTool {
  constructor(props = {}) {
    const defaultProps = { name: TOOL_NAMES.BRUSH_3D_HU_GATED_TOOL };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  /**
   * Event handler for MOUSE_DOWN event.
   *
   * @override
   * @event
   * @param {Object} evt - The event.
   */
  preMouseDownCallback(evt) {
    const eventData = evt.detail;
    const { element, currentPoints } = eventData;

    this.activeGateRange = segmentationModule.getters.activeGateRange();

    this._startPainting(evt);

    this._lastImageCoords = currentPoints.image;
    this._drawing = true;
    this._startListeningForMouseUp(element);
    this._paint(evt);

    return true;
  }

  /**
   * Paints the data to the canvas.
   *
   * @protected
   * @param  {Object} evt The data object associated with the event.
   * @returns {void}
   */
  _paint(evt) {
    const eventData = evt.detail;
    const { element, image } = eventData;
    const { rows, columns } = image;
    const { x, y } = eventData.currentPoints.image;

    if (x < 0 || x > columns || y < 0 || y > rows) {
      return;
    }

    const radius = segmentationModule.configuration.radius;
    const pointerArray = this._gateCircle(
      image,
      getCircle(radius, rows, columns, x, y)
    );

    const {
      labelmap2D,
      labelmap3D,
      shouldErase,
      activeLabelmapIndex,
    } = this.paintEventData;

    // Draw / Erase the active color.
    drawBrushPixels(
      pointerArray,
      labelmap2D.pixelData,
      labelmap3D.activeSegmentIndex,
      columns,
      shouldErase
    );

    if (labelmap3D.isFractional) {
      this._setProbabilityOfFractionalTo100(pointerArray, rows, columns);
    }

    cornerstone.triggerEvent(element, EVENTS.LABELMAP_MODIFIED, {
      activeLabelmapIndex,
    });

    cornerstone.updateImage(evt.detail.element);
  }

  /**
   * _gateCircle - Given an image and a brush circle, gate the circle between
   * the set gate values, and then cleanup the resulting mask using the
   * holeFill and strayRemove properties of the brush module.
   *
   * @param  {object} image   The cornerstone image.
   * @param  {Number[][]} circle  An array of image pixels contained within the brush
   *                        circle.
   * @returns {Number[][]}  An array containing the gated/cleaned pixels to fill.
   */
  _gateCircle(image, circle) {
    const rows = image.rows;
    const imagePixelData = image.getPixelData();
    const gateRange = this.activeGateRange;
    const rescaleSlope = image.slope || 1;
    const rescaleIntercept = image.intercept || 0;

    const gatedCircleArray = [];

    for (let i = 0; i < circle.length; i++) {
      let pixelValue = imagePixelData[circle[i][0] + circle[i][1] * rows];

      pixelValue = pixelValue * rescaleSlope + rescaleIntercept;

      if (pixelValue >= gateRange[0] && pixelValue <= gateRange[1]) {
        gatedCircleArray.push(circle[i]);
      }
    }

    return this._cleanGatedCircle(circle, gatedCircleArray);
  }

  /**
   * _getEdgePixels - Returns the indicies of the edge pixels for the circular
   * brush data.
   *
   * @param  {Number[][]} data The squared-circle data where all circle members are
   *                     0, and values outside the circle are -1
   * @returns {Number[][]} An array of positions of the circle edge pixels.
   */
  _getEdgePixels(data) {
    const edgePixels = [];
    const xSize = data.length;
    const ySize = data[0].length;

    // first and last row add all of top and bottom which are circle members.
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) {
        edgePixels.push([i, 0]);
        edgePixels.push([i, ySize - 1]);
      }
    }

    // all other rows - Find first circle member, and use its position to add
    // The first and last circle member of that row.
    for (let j = 1; j < ySize - 1; j++) {
      for (let i = 0; i < data.length; i++) {
        if (data[i][j]) {
          edgePixels.push([i, j]);
          edgePixels.push([xSize - 1 - i, j]);

          break;
        }
      }
    }

    return edgePixels;
  }

  /**
   * _cleanGatedCircle - Clean the HU gated circle using the holeFill and
   * strayRemove properties of the brush module.
   *
   * @param  {Number[][]} circle     An array of the pixel indicies within the
   *                                 brush circle.
   * @param  {Number[][]} gatedCircleArray An array of the pixel indicies within
   *                                       the gate range.
   * @returns {Number[][]}                  The cleaned array of pixel indicies.
   */
  _cleanGatedCircle(circle, gatedCircleArray) {
    const { max, min } = this._getBoundingBoxOfCircle(circle);

    const xSize = max[0] - min[0] + 1;
    const ySize = max[1] - min[1] + 1;

    const data = this._boxGatedCircle(
      circle,
      gatedCircleArray,
      min,
      xSize,
      ySize
    );

    // Define our getter for accessing the data structure.
    function getter(x, y) {
      return data[x][y];
    }

    this._floodFillEmptyRegionsFromEdges(data, getter);

    const { holes, regions } = this._findHolesAndRegions(
      circle,
      data,
      getter,
      min
    );

    const largestRegionArea = this._getAreaOfLargestRegion(regions);

    // Delete any region outside the `strayRemove` threshold.
    for (let r = 0; r < regions.length; r++) {
      const region = regions[r];

      if (
        region.length <=
        (segmentationModule.configuration.strayRemove / 100.0) *
          largestRegionArea
      ) {
        for (let p = 0; p < region.length; p++) {
          data[region[p][0]][region[p][1]] = 3;
        }
      }
    }

    // Fill in any holes smaller than the `holeFill` threshold.
    for (let r = 0; r < holes.length; r++) {
      const hole = holes[r];

      if (
        hole.length <=
        (segmentationModule.configuration.holeFill / 100.0) * largestRegionArea
      ) {
        for (let p = 0; p < hole.length; p++) {
          data[hole[p][0]][hole[p][1]] = 5;
        }
      }
    }

    const filledGatedCircleArray = [];

    for (let i = 0; i < xSize; i++) {
      for (let j = 0; j < ySize; j++) {
        if (data[i][j] === 5) {
          filledGatedCircleArray.push([i + min[0], j + min[1]]);
        }
      }
    }

    return filledGatedCircleArray;
  }

  /**
   * _getBoundingBoxOfCircle - Returns two points defining the extent of the circle.
   *
   * @param  {number[][]} circle  An array of the pixel indicies within the brush circle.
   * @returns {object}        The minimum and maximum of the extent.
   */
  _getBoundingBoxOfCircle(circle) {
    const max = [circle[0][0], circle[0][1]];
    const min = [circle[0][0], circle[0][1]];

    for (let p = 0; p < circle.length; p++) {
      const [i, j] = circle[p];

      if (i > max[0]) {
        max[0] = i;
      } else if (i < min[0]) {
        min[0] = i;
      }

      if (j > max[1]) {
        max[1] = j;
      } else if (j < min[1]) {
        min[1] = j;
      }
    }

    return { max, min };
  }

  /**
   * _boxGatedCircle - Generates a rectangular dataset from the brush circle
   *                   for efficient flood fill/cleaning.
   *
   * @param  {type} circle           An array of the pixel indicies within the brush circle.
   * @param  {type} gatedCircleArray The circle array with the gate applied.
   * @param  {type} min              The location of the top left pixel of the
   *                                 generated dataset with respect to the
   *                                 underlying image data.
   * @param  {type} xSize            The x size of the generated box.
   * @param  {type} ySize            The y size of the generated box.
   * @returns {number[][]}           The data with pixel [0,0] centered on min,
   *                                 the circle marked with 1 for unoccupied, 2
   *                                 for occupied and 0 for outside of the circle bounds.
   */
  _boxGatedCircle(circle, gatedCircleArray, min, xSize, ySize) {
    const data = [];

    // Fill in square as 0 (out of bounds/ignore).
    for (let i = 0; i < xSize; i++) {
      data[i] = new Uint8ClampedArray(ySize);
    }

    // fill circle in as 1.
    for (let p = 0; p < circle.length; p++) {
      const i = circle[p][0] - min[0];
      const j = circle[p][1] - min[1];

      data[i][j] = 1;
    }

    // fill gated region as 2.
    for (let p = 0; p < gatedCircleArray.length; p++) {
      const i = gatedCircleArray[p][0] - min[0];
      const j = gatedCircleArray[p][1] - min[1];

      data[i][j] = 2;
    }

    return data;
  }

  /**
   * _floodFillEmptyRegionsFromEdges - Flood fills empty regions which touch the
   *                                   edge of the circle with the value 3.
   *
   * @param  {number[][]} data The data to flood fill.
   * @param {function} getter The getter function floodFill uses to access array
   *                          elements.
   * @modifies data
   * @returns {null}
   */
  _floodFillEmptyRegionsFromEdges(data, getter) {
    const edgePixels = this._getEdgePixels(data);

    for (let p = 0; p < edgePixels.length; p++) {
      const i = edgePixels[p][0];
      const j = edgePixels[p][1];

      if (data[i][j] === 1) {
        const result = floodFill({
          getter: getter,
          seed: [i, j],
        });

        const flooded = result.flooded;

        for (let k = 0; k < flooded.length; k++) {
          data[flooded[k][0]][flooded[k][1]] = 3;
        }
      }
    }
  }

  /**
   * _findHolesAndRegions - Finds all the holes and regions and returns their
   *                        positions within the 2D data set. Sets the value of
   *                        holes and regions to 4 and 5, respectively.
   *
   * @param  {number[][]} circle An array of the pixel indicies within the brush circle.
   * @param  {number[][]} data   The data set.
   * @param  {function}   getter The getter function floodFill uses to access array
   *                       elements.
   * @param  {number[]}   min    The location of the top left pixel of the dataset
   *                       with respect to the underlying image data.
   * @returns {object}    An object containing arrays of the occupation of all
   *                      regions and holes in the dataset.
   */
  _findHolesAndRegions(circle, data, getter, min) {
    const holes = [];
    const regions = [];

    // Find each hole and paint them 3.
    // Find contiguous regions and paint them 4.
    for (let p = 0; p < circle.length; p++) {
      const i = circle[p][0] - min[0];
      const j = circle[p][1] - min[1];

      if (data[i][j] === 1) {
        const result = floodFill({
          getter: getter,
          seed: [i, j],
        });

        const flooded = result.flooded;

        for (let k = 0; k < flooded.length; k++) {
          data[flooded[k][0]][flooded[k][1]] = 4;
        }

        holes.push(flooded);
      } else if (data[i][j] === 2) {
        const result = floodFill({
          getter: getter,
          seed: [i, j],
        });

        const flooded = result.flooded;

        for (let k = 0; k < flooded.length; k++) {
          data[flooded[k][0]][flooded[k][1]] = 5;
        }

        regions.push(flooded);
      }
    }

    return { holes, regions };
  }

  /**
   * _getAreaOfLargestRegion - Returns the number of pixels in the largest
   *                           region of a list of regions.
   *
   * @param  {number[][][]} regions An array of regions of 2D points.
   * @returns {number}        The area of the largest region in pixels.
   */
  _getAreaOfLargestRegion(regions) {
    let largestRegionArea = 0;

    for (let i = 0; i < regions.length; i++) {
      if (regions[i].length > largestRegionArea) {
        largestRegionArea = regions[i].length;
      }
    }

    return largestRegionArea;
  }
}
