import cornerstoneTools from 'cornerstone-tools';
import Brush3DHUGatedTool from './Brush3DHUGatedTool.js';
import TOOL_NAMES from '../../toolNames';

const { getCircle } = cornerstoneTools.importInternal('util/segmentationUtils');
const segmentationModule = cornerstoneTools.getModule('segmentation');

export default class Brush3DAutoGatedTool extends Brush3DHUGatedTool {
  constructor(props = {}) {
    const defaultProps = { name: TOOL_NAMES.BRUSH_3D_AUTO_GATED_TOOL };
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

    this._setCustomGate(evt);
    this._startPainting(evt);

    this._lastImageCoords = currentPoints.image;
    this._drawing = true;
    this._startListeningForMouseUp(element);
    this._paint(evt);

    return true;
  }

  /**
   * _setCustomGate - Gets the minimum and maximum brush values within the image
   * and sets the gate mode to "custom" with these values.
   *
   * @param  {object} evt The cornerstone event.
   * @returns {null}
   */
  _setCustomGate(evt) {
    const eventData = evt.detail;
    const image = eventData.image;
    const { rows, columns } = image;
    const { x, y } = eventData.currentPoints.image;
    const radius = segmentationModule.configuration.radius;
    const imagePixelData = image.getPixelData();
    const rescaleSlope = image.slope || 1;
    const rescaleIntercept = image.intercept || 0;

    const circle = getCircle(radius, rows, columns, x, y);

    // Initialise hi and lo as the first pixelValue in the circle.
    let lo = imagePixelData[circle[0][0] + circle[0][1] * rows];
    let hi = lo;

    // Find the highest and lowest value.
    for (let i = 0; i < circle.length; i++) {
      let pixelValue = imagePixelData[circle[i][0] + circle[i][1] * rows];

      if (pixelValue < lo) {
        lo = pixelValue;
      }

      if (pixelValue > hi) {
        hi = pixelValue;
      }
    }

    lo = lo * rescaleSlope + rescaleIntercept;
    hi = hi * rescaleSlope + rescaleIntercept;

    this.gate = [lo, hi];
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
    const gateValues = this.gate;
    const rescaleSlope = image.slope || 1;
    const rescaleIntercept = image.intercept || 0;

    const gatedCircleArray = [];

    for (let i = 0; i < circle.length; i++) {
      let pixelValue = imagePixelData[circle[i][0] + circle[i][1] * rows];

      pixelValue = pixelValue * rescaleSlope + rescaleIntercept;

      if (pixelValue >= gateValues[0] && pixelValue <= gateValues[1]) {
        gatedCircleArray.push(circle[i]);
      }
    }

    return this._cleanGatedCircle(circle, gatedCircleArray);
  }
}
