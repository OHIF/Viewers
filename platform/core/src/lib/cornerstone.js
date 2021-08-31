import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

function getBoundingBox(context, textLines, x, y, options) {
  if (Object.prototype.toString.call(textLines) !== '[object Array]') {
    textLines = [textLines];
  }

  const padding = 5;
  const font = cornerstoneTools.textStyle.getFont();
  const fontSize = cornerstoneTools.textStyle.getFontSize();

  context.save();
  context.font = font;
  context.textBaseline = 'top';

  // Find the longest text width in the array of text data
  let maxWidth = 0;

  textLines.forEach(text => {
    // Get the text width in the current font
    const width = context.measureText(text).width;

    // Find the maximum with for all the text Rows;
    maxWidth = Math.max(maxWidth, width);
  });

  // Calculate the bounding box for this text box
  const boundingBox = {
    width: maxWidth + padding * 2,
    height: padding + textLines.length * (fontSize + padding),
  };

  if (options && options.centering && options.centering.x === true) {
    x -= boundingBox.width / 2;
  }

  if (options && options.centering && options.centering.y === true) {
    y -= boundingBox.height / 2;
  }

  boundingBox.left = x;
  boundingBox.top = y;

  context.restore();

  // Return the bounding box so it can be used for pointNearHandle
  return boundingBox;
}

function pixelToPage(element, position) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const result = {
    x: 0,
    y: 0,
  };

  // Stop here if the cornerstone element is not enabled or position is not an object
  if (!enabledElement || typeof position !== 'object') {
    return result;
  }

  const canvas = enabledElement.canvas;

  const canvasOffset = $(canvas).offset();
  result.x += canvasOffset.left;
  result.y += canvasOffset.top;

  const canvasPosition = cornerstone.pixelToCanvas(element, position);
  result.x += canvasPosition.x;
  result.y += canvasPosition.y;

  return result;
}

function repositionTextBox(eventData, measurementData, config) {
  // Stop here if it's not a measurement creating
  if (!measurementData.isCreating) {
    return;
  }

  const element = eventData.element;
  const enabledElement = cornerstone.getEnabledElement(element);
  const image = enabledElement.image;

  const allowedBorders = OHIF.uiSettings.autoPositionMeasurementsTextCallOuts;
  const allow = {
    T: !allowedBorders || allowedBorders.includes('T'),
    R: !allowedBorders || allowedBorders.includes('R'),
    B: !allowedBorders || allowedBorders.includes('B'),
    L: !allowedBorders || allowedBorders.includes('L'),
  };

  const getAvailableBlankAreas = (enabledElement, labelWidth, labelHeight) => {
    const { element, canvas, image } = enabledElement;

    const topLeft = cornerstone.pixelToCanvas(element, {
      x: 0,
      y: 0,
    });

    const bottomRight = cornerstone.pixelToCanvas(element, {
      x: image.width,
      y: image.height,
    });

    const $canvas = $(canvas);
    const canvasWidth = $canvas.outerWidth();
    const canvasHeight = $canvas.outerHeight();

    const result = {};
    result['x-1'] = allow.L && topLeft.x > labelWidth;
    result['y-1'] = allow.T && topLeft.y > labelHeight;
    result.x1 = allow.R && canvasWidth - bottomRight.x > labelWidth;
    result.y1 = allow.B && canvasHeight - bottomRight.y > labelHeight;

    return result;
  };

  const getRenderingInformation = (limits, tool) => {
    const mid = {};
    mid.x = limits.x / 2;
    mid.y = limits.y / 2;

    const directions = {};
    directions.x = tool.x < mid.x ? -1 : 1;
    directions.y = tool.y < mid.y ? -1 : 1;

    const diffX = directions.x < 0 ? tool.x : limits.x - tool.x;
    const diffY = directions.y < 0 ? tool.y : limits.y - tool.y;
    let cornerAxis = diffY < diffX ? 'y' : 'x';

    const map = {
      'x-1': 'L',
      'y-1': 'T',
      x1: 'R',
      y1: 'B',
    };

    let current = 0;
    while (current < 4 && !allow[map[cornerAxis + directions[cornerAxis]]]) {
      // Invert the direction for the next iteration
      directions[cornerAxis] *= -1;

      // Invert the tempCornerAxis
      cornerAxis = cornerAxis === 'x' ? 'y' : 'x';

      current++;
    }

    return {
      directions,
      cornerAxis,
    };
  };

  const calculateAxisCenter = (axis, start, end) => {
    const a = start[axis];
    const b = end[axis];
    const lowest = Math.min(a, b);
    const highest = Math.max(a, b);
    return lowest + (highest - lowest) / 2;
  };

  const getTextBoxSizeInPixels = (element, bounds) => {
    const topLeft = cornerstone.pageToPixel(element, 0, 0);
    const bottomRight = cornerstone.pageToPixel(element, bounds.x, bounds.y);
    return {
      x: bottomRight.x - topLeft.x,
      y: bottomRight.y - topLeft.y,
    };
  };

  function getTextBoxOffset(config, cornerAxis, toolAxis, boxSize) {
    config = config || {};
    const centering = config.centering || {};
    const centerX = !!centering.x;
    const centerY = !!centering.y;
    const halfBoxSizeX = boxSize.x / 2;
    const halfBoxSizeY = boxSize.y / 2;
    const offset = {
      x: [],
      y: [],
    };

    if (cornerAxis === 'x') {
      const offsetY = centerY ? 0 : halfBoxSizeY;

      offset.x[-1] = centerX ? halfBoxSizeX : 0;
      offset.x[1] = centerX ? -halfBoxSizeX : -boxSize.x;
      offset.y[-1] = offsetY;
      offset.y[1] = offsetY;
    } else {
      const offsetX = centerX ? 0 : halfBoxSizeX;

      offset.x[-1] = offsetX;
      offset.x[1] = offsetX;
      offset.y[-1] = centerY ? halfBoxSizeY : 0;
      offset.y[1] = centerY ? -halfBoxSizeY : -boxSize.y;
    }

    return offset;
  }

  const handles = measurementData.handles;
  const textBox = handles.textBox;

  const $canvas = $(enabledElement.canvas);
  const canvasWidth = $canvas.outerWidth();
  const canvasHeight = $canvas.outerHeight();
  const offset = $canvas.offset();
  const canvasDimensions = {
    x: canvasWidth,
    y: canvasHeight,
  };

  const bounds = {};
  bounds.x = textBox.boundingBox.width;
  bounds.y = textBox.boundingBox.height;

  const getHandlePosition = key => {
    const { x, y } = handles[key];

    return { x, y };
  };
  const start = getHandlePosition('start');
  const end = getHandlePosition('end');

  const tool = {};
  tool.x = calculateAxisCenter('x', start, end);
  tool.y = calculateAxisCenter('y', start, end);

  let limits = {};
  limits.x = image.width;
  limits.y = image.height;

  let { directions, cornerAxis } = getRenderingInformation(limits, tool);

  const availableAreas = getAvailableBlankAreas(
    enabledElement,
    bounds.x,
    bounds.y
  );
  const tempDirections = Object.assign({}, directions);
  let tempCornerAxis = cornerAxis;
  let foundPlace = false;
  let current = 0;
  while (current < 4) {
    if (availableAreas[tempCornerAxis + tempDirections[tempCornerAxis]]) {
      foundPlace = true;
      break;
    }

    // Invert the direction for the next iteration
    tempDirections[tempCornerAxis] *= -1;

    // Invert the tempCornerAxis
    tempCornerAxis = tempCornerAxis === 'x' ? 'y' : 'x';

    current++;
  }

  let cornerAxisPosition;
  if (foundPlace) {
    directions = Object.assign({}, directions, tempDirections);
    cornerAxis = tempCornerAxis;
    cornerAxisPosition = directions[cornerAxis] < 0 ? 0 : limits[cornerAxis];
  } else {
    limits = Object.assign({}, limits, canvasDimensions);

    const toolPositionOnCanvas = cornerstone.pixelToCanvas(element, tool);
    const renderingInformation = getRenderingInformation(
      limits,
      toolPositionOnCanvas
    );
    directions = renderingInformation.directions;
    cornerAxis = renderingInformation.cornerAxis;

    const position = {
      x: directions.x < 0 ? offset.left : offset.left + canvasWidth,
      y: directions.y < 0 ? offset.top : offset.top + canvasHeight,
    };

    const pixelPosition = cornerstone.pageToPixel(
      element,
      position.x,
      position.y
    );
    cornerAxisPosition = pixelPosition[cornerAxis];
  }

  const toolAxis = cornerAxis === 'x' ? 'y' : 'x';
  const boxSize = getTextBoxSizeInPixels(element, bounds);

  textBox[cornerAxis] = cornerAxisPosition;
  textBox[toolAxis] = tool[toolAxis];

  // Adjust the text box position reducing its size from the corner axis
  const textBoxOffset = getTextBoxOffset(config, cornerAxis, toolAxis, boxSize);
  textBox[cornerAxis] += textBoxOffset[cornerAxis][directions[cornerAxis]];

  // Preventing the text box from partially going outside the canvas area
  const topLeft = cornerstone.pixelToCanvas(element, textBox);
  const bottomRight = {
    x: topLeft.x + bounds.x,
    y: topLeft.y + bounds.y,
  };
  const canvasBorders = {
    x0: offset.left,
    y0: offset.top,
    x1: offset.left + canvasWidth,
    y1: offset.top + canvasHeight,
  };
  if (topLeft[toolAxis] < 0) {
    const x = canvasBorders.x0;
    const y = canvasBorders.y0;
    const pixelPosition = cornerstone.pageToPixel(element, x, y);
    textBox[toolAxis] = pixelPosition[toolAxis];
  } else if (bottomRight[toolAxis] > canvasDimensions[toolAxis]) {
    const x = canvasBorders.x1 - bounds.x;
    const y = canvasBorders.y1 - bounds.y;
    const pixelPosition = cornerstone.pageToPixel(element, x, y);
    textBox[toolAxis] = pixelPosition[toolAxis];
  }
}

export { getBoundingBox, pixelToPage, repositionTextBox };
