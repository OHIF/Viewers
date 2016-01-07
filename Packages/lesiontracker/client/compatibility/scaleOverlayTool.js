
(function($, cornerstone, cornerstoneTools) {

  'use strict';



  // Draw Intervals
  function drawIntervals (context, config) {

    var i = 0;

    while (config.verticalLine.start.y + i * config.minorTick <= config.vscaleBounds.bottom) {
      context.beginPath();
      context.strokeStyle = config.color;
      context.lineWidth = config.lineWidth;
      context.moveTo(config.verticalLine.start.x, config.verticalLine.start.y + i*config.minorTick);

      if (i%5 === 0) {
        context.lineTo(config.verticalLine.start.x - config.majorTickLength, config.verticalLine.start.y + i*config.minorTick);

      } else{
        context.lineTo(config.verticalLine.start.x - config.minorTickLength, config.verticalLine.start.y + i*config.minorTick);

      }
      context.stroke();

      i++;
    }

    i = 0;

    while (config.horizontalLine.start.x + i * config.minorTick <= config.hscaleBounds.right) {
      context.beginPath();
      context.strokeStyle = config.color;
      context.lineWidth = config.lineWidth;
      context.moveTo(config.horizontalLine.start.x + i * config.minorTick, config.horizontalLine.start.y);
      if (i%5 === 0) {
        context.lineTo(config.horizontalLine.start.x + i * config.minorTick, config.horizontalLine.start.y - config.majorTickLength);

      } else{
        context.lineTo(config.horizontalLine.start.x + i * config.minorTick, config.horizontalLine.start.y - config.minorTickLength);

      }
      context.stroke();

      i++;

    }

  }

  // Draws long horizontal and vertical lines
  function drawFrameLines(context, config){

    // Vertical Line
    context.beginPath();
    context.strokeStyle = config.color;
    context.lineWidth = config.lineWidth;
    context.moveTo(config.verticalLine.start.x, config.verticalLine.start.y);
    context.lineTo(config.verticalLine.end.x, config.verticalLine.end.y);
    context.stroke();

    // Horizontal line
    context.beginPath();
    context.strokeStyle = config.color;
    context.lineWidth = config.lineWidth;
    context.moveTo(config.horizontalLine.start.x, config.horizontalLine.start.y);
    context.lineTo(config.horizontalLine.end.x, config.horizontalLine.end.y);
    context.stroke();

    // Draw intervals
    drawIntervals(context, config);

  }

  function doesIntersect(canvasBounds, imageBounds) {
    var intersectLeftRight;
    var intersectTopBottom;

    if (canvasBounds.width >= 0)
    {
      if (imageBounds.width >= 0)
        intersectLeftRight = !((canvasBounds.right <= imageBounds.left) || (imageBounds.right <= canvasBounds.left));
      else
        intersectLeftRight = !((canvasBounds.right <= imageBounds.right) || (imageBounds.left <= canvasBounds.left));
    }
    else
    {
      if (imageBounds.width >= 0)
        intersectLeftRight = !((canvasBounds.left <= imageBounds.left) || (imageBounds.right <= canvasBounds.right));
      else
        intersectLeftRight = !((canvasBounds.left <= imageBounds.right) || (imageBounds.left <= canvasBounds.right));
    }

    if (canvasBounds.height >= 0)
    {
      if (imageBounds.height >= 0)
        intersectTopBottom = !((canvasBounds.bottom <= imageBounds.top) || (imageBounds.bottom <= canvasBounds.top));
      else
        intersectTopBottom = !((canvasBounds.bottom <= imageBounds.bottom) || (imageBounds.top <= canvasBounds.top));
    }
    else
    {
      if (imageBounds.height >= 0)
        intersectTopBottom = !((canvasBounds.top <= imageBounds.top) || (imageBounds.bottom <= canvasBounds.bottom));
      else
        intersectTopBottom = !((canvasBounds.top <= imageBounds.bottom) || (imageBounds.top <= canvasBounds.bottom));
    }

    return intersectLeftRight && intersectTopBottom;
  }

  function getIntersectionRectangle(canvasBounds, imageBounds) {
    var intersectPoints = {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };

    if(!doesIntersect(canvasBounds, imageBounds)) {
      return intersectPoints;

    }

    if (canvasBounds.width >= 0)
    {
      if (imageBounds.width >= 0)
      {
        intersectPoints.left = Math.max(canvasBounds.left, imageBounds.left);
        intersectPoints.right = Math.min(canvasBounds.right, imageBounds.right);
      }
      else
      {
        intersectPoints.left = Math.max(canvasBounds.left, imageBounds.right);
        intersectPoints.right = Math.min(canvasBounds.right, imageBounds.left);
      }
    }
    else
    {
      if (imageBounds.width >= 0)
      {
        intersectPoints.left = Math.min(canvasBounds.left, imageBounds.right);
        intersectPoints.right = Math.max(canvasBounds.right, imageBounds.left);
      }
      else
      {
        intersectPoints.left = Math.min(canvasBounds.left, imageBounds.left);
        intersectPoints.right = Math.max(canvasBounds.right, imageBounds.right);
      }
    }

    if (canvasBounds.height >= 0)
    {
      if (imageBounds.height >= 0)
      {
        intersectPoints.top = Math.max(canvasBounds.top, imageBounds.top);
        intersectPoints.bottom = Math.min(canvasBounds.bottom, imageBounds.bottom);
      }
      else
      {
        intersectPoints.top = Math.max(canvasBounds.top, imageBounds.bottom);
        intersectPoints.bottom = Math.min(canvasBounds.bottom, imageBounds.top);
      }
    }
    else
    {
      if (imageBounds.height >= 0)
      {
        intersectPoints.top = Math.min(canvasBounds.top, imageBounds.bottom);
        intersectPoints.bottom = Math.max(canvasBounds.bottom, imageBounds.top);
      }
      else
      {
        intersectPoints.top = Math.min(canvasBounds.top, imageBounds.top);
        intersectPoints.bottom = Math.max(canvasBounds.bottom, imageBounds.bottom);
      }
    }

    return intersectPoints;

  }

  // Computes the max bound for scales on the image
  function computeScaleBounds(eventData, canvasSize, imageSize, horizontalReduction, verticalReduction) {

    var canvasBounds = {
      left: 0,
      top: 0,
      right: canvasSize.width,
      bottom: canvasSize.height,
      width: canvasSize.width,
      height: canvasSize.height
    };

    var hReduction = horizontalReduction * Math.min(1000, canvasSize.width);
    var vReduction = verticalReduction * Math.min(1000, canvasSize.height);
    canvasBounds = {
      left: canvasBounds.left + hReduction,
      top: canvasBounds.top + vReduction,
      right: (canvasBounds.left + hReduction) + (canvasBounds.width - 2 * hReduction),
      bottom: (canvasBounds.top + vReduction) + (canvasBounds.height - 2 * vReduction),
      width: canvasBounds.width - 2 * hReduction,
      height: canvasBounds.height - 2 * vReduction
    };

    var startPoint = getStartPointOfImage(eventData, canvasSize, imageSize);
    var imageBounds = {
      left: startPoint.x,
      top: startPoint.y,
      right: startPoint.x + imageSize.width,
      bottom: startPoint.y + imageSize.height,
      width: imageSize.width,
      height: imageSize.height

    };
    hReduction = horizontalReduction * imageBounds.width;
    vReduction = verticalReduction * imageBounds.height;
    imageBounds = {
      left: imageBounds.left + hReduction,
      top: imageBounds.top + vReduction,
      right: (imageBounds.left + hReduction) + (imageBounds.width - 2 * hReduction),
      bottom: (imageBounds.top + vReduction) + (imageBounds.height - 2 * vReduction),
      width: imageBounds.width - 2 * hReduction,
      height: imageBounds.height - 2 * vReduction

    };

    return getIntersectionRectangle(canvasBounds, imageBounds);

  }

  function getStartPointOfImage(eventData, canvasSize, imageSize) {
    // TODO: Start point must come from cornerstone!
    var startPoint= {};
    startPoint.x = (canvasSize.width - imageSize.width) / 2  + eventData.viewport.translation.x * eventData.viewport.scale;
    startPoint.y = (canvasSize.height - imageSize.height) / 2  + eventData.viewport.translation.y * eventData.viewport.scale;

    return startPoint;

  }

  function onImageRendered(e, eventData) {

    // Check whether pixel spacing is defined
    if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
      return;
    }

    var viewport = cornerstone.getViewport(eventData.enabledElement.element);
    if (!viewport) {
      return;
    }

    console.log(eventData);

    var canvasSize = { width: eventData.enabledElement.canvas.width, height: eventData.enabledElement.canvas.height};
    var imageSize = {width: eventData.enabledElement.image.width , height: eventData.enabledElement.image.height};

    // Distance between intervals is 10mm
    var intervalScale = viewport.scale * 10.0;

    if (!canvasSize.width || !canvasSize.height || !imageSize.width || !imageSize.height ) {
      return false;
    }

    imageSize.width = imageSize.width * viewport.scale;
    imageSize.height = imageSize.height * viewport.scale;

    // 0.1 and 0.05 gives margin to horizontal and vertical lines
    var hscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.1, 0.05);
    var vscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.05, 0.1);

    var config = {
      width: imageSize.width,
      height: imageSize.height,
      hscaleBounds: hscaleBounds,
      vscaleBounds: vscaleBounds,
      minorTick: intervalScale,
      majorTick: 5 * intervalScale,
      minorTickLength: 12.5,
      majorTickLength: 25,
      verticalLine: {
        start: {x: vscaleBounds.right , y: vscaleBounds.top},
        end: {x: vscaleBounds.right, y: vscaleBounds.bottom}
      },
      horizontalLine: {
        start: {x: hscaleBounds.left, y: hscaleBounds.bottom},
        end: {x: hscaleBounds.right, y: hscaleBounds.bottom}
      },
      color: cornerstoneTools.toolColors.getToolColor(),
      lineWidth: cornerstoneTools.toolStyle.getToolWidth()
    };

    var context = eventData.enabledElement.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.save();

    // Draw frame lines
    drawFrameLines(context, config);

    context.restore();

  }

  ///////// END IMAGE RENDERING ///////

  function disable(element) {
    // TODO: displayTool does not have cornerstone.updateImage(element) method to hide tool
    $(element).off('CornerstoneImageRendered', onImageRendered);
    cornerstone.updateImage(element);
  }

  // module exports
  cornerstoneTools.scaleOverlayTool = cornerstoneTools.displayTool(onImageRendered);
  cornerstoneTools.scaleOverlayTool.disable = disable;

})($, cornerstone, cornerstoneTools);