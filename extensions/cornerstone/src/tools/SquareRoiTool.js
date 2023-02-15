import cornerstone from 'cornerstone-core';

import cornerstoneMath from 'cornerstone-math';

import cornerstoneTools, {
  importInternal,
  getToolState,
  store,
  toolStyle,
  toolColors,
  EVENTS,
} from 'cornerstone-tools';
// import drawSquare from './drawSquare';

const BaseAnnotationTool = importInternal('base/BaseAnnotationTool');

const draw = importInternal('drawing/draw');
const drawHandles = importInternal('drawing/drawHandles');
const drawRect = importInternal('drawing/drawRect');
const setShadow = importInternal('drawing/setShadow');
const drawLinkedTextBox = importInternal('drawing/drawLinkedTextBox');
const getNewContext = importInternal('drawing/getNewContext');

const getROITextBoxCoords = importInternal('util/getROITextBoxCoords');
const numbersWithCommas = importInternal('util/numbersWithCommas');
const calculateSUV = importInternal('util/calculateSUV');
const throttle = importInternal('util/throttle');
const getPixelSpacing = importInternal('util/getPixelSpacing');
const getLogger = importInternal('util/getLogger');
const { rectangleRoiCursor } = importInternal('tools/cursors');

// import { rectangleRoiCursor } from '../cursors/index.js';

const logger = getLogger('tools:annotation:RectangleRoiTool');

/**
 * @public
 * @class RectangleRoiTool
 * @memberof Tools.Annotation
 * @classdesc Tool for drawing rectangular regions of interest, and measuring
 * the statistics of the enclosed pixels.
 * @extends Tools.Base.BaseAnnotationTool
 */
export default class SquareRoiTool extends BaseAnnotationTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'SquareRoiTool',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        drawHandles: true,
        drawHandlesOnHover: false,
        hideHandlesIfMoving: false,
        renderDashed: false,
        showMinMax: false,
        showHounsfieldUnits: true
      },
      svgCursor: rectangleRoiCursor,
    };

    super(props, defaultProps);

    this.throttledUpdateCachedStats = throttle(this.updateCachedStats, 110);
  }

  createNewMeasurement(eventData) {
    const goodEventData =
      eventData && eventData.currentPoints && eventData.currentPoints.image;

    if (!goodEventData) {
      logger.error(
        `required eventData not supplied to tool ${this.name}'s createNewMeasurement`
      );

      return;
    }

    return {
      visible: true,
      active: true,
      color: undefined,
      invalidated: true,
      handles: {
        start: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: false,
        },
        end: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true,
        },
        initialRotation: eventData.viewport.rotation,
        textBox: {
          active: false,
          hasMoved: false,
          movesIndependently: false,
          drawnIndependently: true,
          allowedOutsideImage: true,
          hasBoundingBox: true,
        },
      },
    };
  }

  pointNearTool(element, data, coords, interactionType) {
    const hasStartAndEndHandles =
      data && data.handles && data.handles.start && data.handles.end;
    const validParameters = hasStartAndEndHandles;

    if (!validParameters) {
      logger.warn(
        `invalid parameters supplied to tool ${this.name}'s pointNearTool`
      );
    }

    if (!validParameters || data.visible === false) {
      return false;
    }

    const distance = interactionType === 'mouse' ? 15 : 25;
    const startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
    const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

    const rect = {
      left: Math.min(startCanvas.x, endCanvas.x),
      top: Math.min(startCanvas.y, endCanvas.y),
      width: Math.abs(startCanvas.x - endCanvas.x),
      height: Math.abs(startCanvas.y - endCanvas.y),
    };

    const distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);

    return distanceToPoint < distance;
  }

  updateCachedStats(image, element, data) {
    const seriesModule =
      cornerstone.metaData.get('generalSeriesModule', image.imageId) || {};
    const modality = seriesModule.modality;
    const pixelSpacing = getPixelSpacing(image);

    const stats = _calculateStats(
      image,
      element,
      data.handles,
      modality,
      pixelSpacing
    );

    data.cachedStats = stats;
    data.invalidated = false;
  }

  renderToolData(evt) {
    const toolData = getToolState(evt.currentTarget, this.name);

    if (!toolData) {
      return;
    }

    const eventData = evt.detail;
    const { image, element } = eventData;
    const lineWidth = toolStyle.getToolWidth();
    const lineDash = cornerstoneTools.getModule('globalConfiguration')
      .configuration.lineDash;
    const {
      handleRadius,
      drawHandlesOnHover,
      hideHandlesIfMoving,
      renderDashed,
    } = this.configuration;
    const context = getNewContext(eventData.canvasContext.canvas);
    const { rowPixelSpacing, colPixelSpacing } = getPixelSpacing(image);

    // Meta
    const seriesModule =
      cornerstone.metaData.get('generalSeriesModule', image.imageId) || {};

    // Pixel Spacing
    const modality = seriesModule.modality;
    const hasPixelSpacing = rowPixelSpacing && colPixelSpacing;

    draw(context, context => {
      // If we have tool data for this element - iterate over each set and draw it
    
    });
  }
}

/**
 * TODO: This is the same method (+ GetPixels) for the other ROIs
 * TODO: The pixel filtering is the unique bit
 *
 * @param {*} startHandle
 * @param {*} endHandle
 * @returns {{ left: number, top: number, width: number, height: number}}
 */
function _getRectangleImageCoordinates(startHandle, endHandle) {
  return {
    left: Math.min(startHandle.x, endHandle.x),
    top: Math.min(startHandle.y, endHandle.y),
    width: Math.abs(startHandle.x - endHandle.x),
    height: Math.abs(startHandle.y - endHandle.y),
  };
}

/**
 *
 *
 * @param {*} image
 * @param {*} element
 * @param {*} handles
 * @param {*} modality
 * @param {*} pixelSpacing
 * @returns {Object} The Stats object
 */
function _calculateStats(image, element, handles, modality, pixelSpacing) {
  // Retrieve the bounds of the rectangle in image coordinates
  const roiCoordinates = _getRectangleImageCoordinates(
    handles.start,
    handles.end
  );

  // Retrieve the array of pixels that the rectangle bounds cover
  const pixels = cornerstone.getPixels(
    element,
    roiCoordinates.left,
    roiCoordinates.top,
    roiCoordinates.width,
    roiCoordinates.height
  );

  // Calculate the mean & standard deviation from the pixels and the rectangle details
  const roiMeanStdDev = _calculateRectangleStats(pixels, roiCoordinates);

  let meanStdDevSUV;

  if (modality === 'PT') {
    meanStdDevSUV = {
      mean: calculateSUV(image, roiMeanStdDev.mean, true) || 0,
      stdDev: calculateSUV(image, roiMeanStdDev.stdDev, true) || 0,
    };
  }

  // Calculate the image area from the rectangle dimensions and pixel spacing
  const area =
    roiCoordinates.width *
    (pixelSpacing.colPixelSpacing || 1) *
    (roiCoordinates.height * (pixelSpacing.rowPixelSpacing || 1));

  const perimeter =
    roiCoordinates.width * 2 * (pixelSpacing.colPixelSpacing || 1) +
    roiCoordinates.height * 2 * (pixelSpacing.rowPixelSpacing || 1);

  return {
    area: area || 0,
    perimeter,
    count: roiMeanStdDev.count || 0,
    mean: roiMeanStdDev.mean || 0,
    variance: roiMeanStdDev.variance || 0,
    stdDev: roiMeanStdDev.stdDev || 0,
    min: roiMeanStdDev.min || 0,
    max: roiMeanStdDev.max || 0,
    meanStdDevSUV,
  };
}

/**
 *
 *
 * @param {*} sp
 * @param {*} rectangle
 * @returns {{ count, number, mean: number,  variance: number,  stdDev: number,  min: number,  max: number }}
 */
function _calculateRectangleStats(sp, rectangle) {
  let sum = 0;
  let sumSquared = 0;
  let count = 0;
  let index = 0;
  let min = sp ? sp[0] : null;
  let max = sp ? sp[0] : null;

  for (let y = rectangle.top; y < rectangle.top + rectangle.height; y++) {
    for (let x = rectangle.left; x < rectangle.left + rectangle.width; x++) {
      sum += sp[index];
      sumSquared += sp[index] * sp[index];
      min = Math.min(min, sp[index]);
      max = Math.max(max, sp[index]);
      count++; // TODO: Wouldn't this just be sp.length?
      index++;
    }
  }

  if (count === 0) {
    return {
      count,
      mean: 0.0,
      variance: 0.0,
      stdDev: 0.0,
      min: 0.0,
      max: 0.0,
    };
  }

  const mean = sum / count;
  const variance = sumSquared / count - mean * mean;

  return {
    count,
    mean,
    variance,
    stdDev: Math.sqrt(variance),
    min,
    max,
  };
}

/**
 *
 *
 * @param {*} startHandle
 * @param {*} endHandle
 * @returns {Array.<{x: number, y: number}>}
 */
function _findTextBoxAnchorPoints(startHandle, endHandle) {
  const { left, top, width, height } = _getRectangleImageCoordinates(
    startHandle,
    endHandle
  );

  return [
    {
      // Top middle point of rectangle
      x: left + width / 2,
      y: top,
    },
    {
      // Left middle point of rectangle
      x: left,
      y: top + height / 2,
    },
    {
      // Bottom middle point of rectangle
      x: left + width / 2,
      y: top + height,
    },
    {
      // Right middle point of rectangle
      x: left + width,
      y: top + height / 2,
    },
  ];
}

/**
 *
 *
 * @param {*} area
 * @param {*} hasPixelSpacing
 * @returns {string} The formatted label for showing area
 */
function _formatArea(area, hasPixelSpacing) {
  // This uses Char code 178 for a superscript 2
  const suffix = hasPixelSpacing
    ? ` mm${String.fromCharCode(178)}`
    : ` px${String.fromCharCode(178)}`;

  return `Area: ${numbersWithCommas(area.toFixed(2))}${suffix}`;
}

function _getUnit(modality, showHounsfieldUnits) {
  return modality === 'CT' && showHounsfieldUnits !== false ? 'HU' : '';
}

/**
 * TODO: This is identical to EllipticalROI's same fn
 * TODO: We may want to make this a utility for ROIs with these values?
 *
 * @param {*} context
 * @param {*} isColorImage
 * @param {*} { area, mean, stdDev, min, max, meanStdDevSUV }
 * @param {*} modality
 * @param {*} hasPixelSpacing
 * @param {*} [options={}]
 * @returns {string[]}
 */
function _createTextBoxContent(
  context,
  isColorImage,
  { area, mean, stdDev, min, max, meanStdDevSUV },
  modality,
  hasPixelSpacing,
  options = {}
) {
  const showMinMax = options.showMinMax || false;
  const textLines = [];

  const otherLines = [];

  if (!isColorImage) {
    const hasStandardUptakeValues = meanStdDevSUV && meanStdDevSUV.mean !== 0;
    const unit = _getUnit(modality, options.showHounsfieldUnits);

    let meanString = `Mean: ${numbersWithCommas(mean.toFixed(2))} ${unit}`;
    const stdDevString = `Std Dev: ${numbersWithCommas(
      stdDev.toFixed(2)
    )} ${unit}`;

    // If this image has SUV values to display, concatenate them to the text line
    if (hasStandardUptakeValues) {
      const SUVtext = ' SUV: ';

      const meanSuvString = `${SUVtext}${numbersWithCommas(
        meanStdDevSUV.mean.toFixed(2)
      )}`;
      const stdDevSuvString = `${SUVtext}${numbersWithCommas(
        meanStdDevSUV.stdDev.toFixed(2)
      )}`;

      const targetStringLength = Math.floor(
        context.measureText(`${stdDevString}     `).width
      );

      while (context.measureText(meanString).width < targetStringLength) {
        meanString += ' ';
      }

      otherLines.push(`${meanString}${meanSuvString}`);
      otherLines.push(`${stdDevString}     ${stdDevSuvString}`);
    } else {
      otherLines.push(`${meanString}`);
      otherLines.push(`${stdDevString}`);
    }

    if (showMinMax) {
      let minString = `Min: ${min} ${unit}`;
      const maxString = `Max: ${max} ${unit}`;
      const targetStringLength = hasStandardUptakeValues
        ? Math.floor(context.measureText(`${stdDevString}     `).width)
        : Math.floor(context.measureText(`${meanString}     `).width);

      while (context.measureText(minString).width < targetStringLength) {
        minString += ' ';
      }

      otherLines.push(`${minString}${maxString}`);
    }
  }

  textLines.push(_formatArea(area, hasPixelSpacing));
  otherLines.forEach(x => textLines.push(x));

  return textLines;
}
