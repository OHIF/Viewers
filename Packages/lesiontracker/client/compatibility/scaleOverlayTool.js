
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // Draw Intervals
    function drawIntervals (context, config) {

        var i = 0;

        while (config.verticalLine.start.y + i * config.verticalMinorTick <= config.vscaleBounds.bottom) {

            var startPoint = {
                x: config.verticalLine.start.x,
                y: config.verticalLine.start.y + i * config.verticalMinorTick
            };

            var endPoint = {
                x: 0,
                y: config.verticalLine.start.y + i * config.verticalMinorTick
            };
            if (i% 5 === 0) {

                endPoint.x = config.verticalLine.start.x - config.majorTickLength;
            } else {

                endPoint.x = config.verticalLine.start.x - config.minorTickLength;
            }

            context.beginPath();
            context.strokeStyle = config.color;
            context.lineWidth = config.lineWidth;
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(endPoint.x, endPoint.y);
            context.stroke();

            i++;
        }

        i = 0;

        while (config.horizontalLine.start.x + i * config.horizontalMinorTick <= config.hscaleBounds.right) {

            startPoint = {
                x: config.horizontalLine.start.x + i * config.horizontalMinorTick,
                y: config.horizontalLine.start.y
            };

            endPoint = {
                x: config.horizontalLine.start.x + i * config.horizontalMinorTick,
                y: 0
            };
            if (i% 5 === 0) {

                endPoint.y = config.horizontalLine.start.y - config.majorTickLength;
            } else {

                endPoint.y = config.horizontalLine.start.y - config.minorTickLength;
            }

            context.beginPath();
            context.strokeStyle = config.color;
            context.lineWidth = config.lineWidth;
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(endPoint.x, endPoint.y);
            context.stroke();

            i++;

        }

    }

    // Draws long horizontal and vertical lines
    function drawFrameLines(context, config){

        // Vertical Line
        var startPoint = {
            x: config.verticalLine.start.x,
            y: config.verticalLine.start.y
        };
        var endPoint = {
            x: config.verticalLine.end.x,
            y: config.verticalLine.end.y
        };

        context.beginPath();
        context.strokeStyle = config.color;
        context.lineWidth = config.lineWidth;
        context.moveTo(startPoint.x, startPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.stroke();

        // Horizontal line
        startPoint = {
            x: config.horizontalLine.start.x ,
            y: config.horizontalLine.start.y
        };
        endPoint = {
            x: config.horizontalLine.end.x,
            y: config.horizontalLine.end.y
        };

        context.beginPath();
        context.strokeStyle = config.color;
        context.lineWidth = config.lineWidth;
        context.moveTo(startPoint.x, startPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.stroke();

        // Draw intervals
        drawIntervals(context, config);

    }

    function doesIntersect(canvasBounds, imageBounds) {
        var intersectLeftRight;
        var intersectTopBottom;

        if (canvasBounds.width >= 0) {
            if (imageBounds.width >= 0)
              intersectLeftRight = !((canvasBounds.right <= imageBounds.left) || (imageBounds.right <= canvasBounds.left));
            else
              intersectLeftRight = !((canvasBounds.right <= imageBounds.right) || (imageBounds.left <= canvasBounds.left));
        } else {
            if (imageBounds.width >= 0)
              intersectLeftRight = !((canvasBounds.left <= imageBounds.left) || (imageBounds.right <= canvasBounds.right));
            else
              intersectLeftRight = !((canvasBounds.left <= imageBounds.right) || (imageBounds.left <= canvasBounds.right));
        }

        if (canvasBounds.height >= 0) {
            if (imageBounds.height >= 0)
              intersectTopBottom = !((canvasBounds.bottom <= imageBounds.top) || (imageBounds.bottom <= canvasBounds.top));
            else
              intersectTopBottom = !((canvasBounds.bottom <= imageBounds.bottom) || (imageBounds.top <= canvasBounds.top));
        } else {
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

        if (!doesIntersect(canvasBounds, imageBounds)) {
            return intersectPoints;

        }

        if (canvasBounds.width >= 0) {
            if (imageBounds.width >= 0) {
                intersectPoints.left = Math.max(canvasBounds.left, imageBounds.left);
                intersectPoints.right = Math.min(canvasBounds.right, imageBounds.right);
            } else {
                intersectPoints.left = Math.max(canvasBounds.left, imageBounds.right);
                intersectPoints.right = Math.min(canvasBounds.right, imageBounds.left);
            }
        } else {
            if (imageBounds.width >= 0) {
                intersectPoints.left = Math.min(canvasBounds.left, imageBounds.right);
                intersectPoints.right = Math.max(canvasBounds.right, imageBounds.left);
            } else {
                intersectPoints.left = Math.min(canvasBounds.left, imageBounds.left);
                intersectPoints.right = Math.max(canvasBounds.right, imageBounds.right);
            }
        }

        if (canvasBounds.height >= 0) {
            if (imageBounds.height >= 0) {
                intersectPoints.top = Math.max(canvasBounds.top, imageBounds.top);
                intersectPoints.bottom = Math.min(canvasBounds.bottom, imageBounds.bottom);
            } else {
                intersectPoints.top = Math.max(canvasBounds.top, imageBounds.bottom);
                intersectPoints.bottom = Math.min(canvasBounds.bottom, imageBounds.top);
            }
        } else {
            if (imageBounds.height >= 0) {
                intersectPoints.top = Math.min(canvasBounds.top, imageBounds.bottom);
                intersectPoints.bottom = Math.max(canvasBounds.bottom, imageBounds.top);
            } else {
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

        var startPoint = {
            x: 0,
            y: 0
        };
        var startPointImageBounds = {
            x: startPoint.x,
            y: startPoint.y
        };
        var endPointImageBounds = {
            x: startPoint.x + imageSize.width,
            y: startPoint.y + imageSize.height
        };

        var startPointCanvasImageBounds = cornerstone.pixelToCanvas(eventData.element, startPointImageBounds);
        var endPointCanvasImageBounds = cornerstone.pixelToCanvas(eventData.element, endPointImageBounds);

        var imageBoundsWidth = Math.abs(startPointCanvasImageBounds.x - endPointCanvasImageBounds.x);
        var imageBoundsHeight = Math.abs(startPointCanvasImageBounds.y - endPointCanvasImageBounds.y);

        hReduction = horizontalReduction * imageBoundsWidth;
        vReduction = verticalReduction * imageBoundsHeight;

        var imageBounds = {
            left: startPointCanvasImageBounds.x + hReduction,
            top: startPointCanvasImageBounds.y + vReduction,
            right: (startPointCanvasImageBounds.x + hReduction) + (imageBoundsWidth - 2 * hReduction),
            bottom: (startPointCanvasImageBounds.y + vReduction) + (imageBoundsHeight - 2 * vReduction),
            width: imageBoundsWidth - 2 * hReduction,
            height: imageBoundsHeight - 2 * vReduction

        };

        return getIntersectionRectangle(canvasBounds, imageBounds);

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

        var canvasSize = {
            width: eventData.enabledElement.canvas.width,
            height: eventData.enabledElement.canvas.height
        };
        var imageSize = {
            width: eventData.enabledElement.image.width ,
            height: eventData.enabledElement.image.height
        };

        // Distance between intervals is 10mm
        var verticalIntervalScale = (10.0 / eventData.enabledElement.image.rowPixelSpacing) * eventData.viewport.scale;
        var horizontalIntervalScale = (10.0 / eventData.enabledElement.image.rowPixelSpacing) * eventData.viewport.scale;

        if (!canvasSize.width || !canvasSize.height || !imageSize.width || !imageSize.height ) {
            return false;
        }

        // 0.1 and 0.05 gives margin to horizontal and vertical lines
        var hscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.1, 0.05);
        var vscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.05, 0.1);

        var config = {
            width: imageSize.width,
            height: imageSize.height,
            hscaleBounds: hscaleBounds,
            vscaleBounds: vscaleBounds,
            verticalMinorTick: verticalIntervalScale,
            horizontalMinorTick: horizontalIntervalScale,
            minorTickLength: 12.5,
            majorTickLength: 25,
            verticalLine: {
                start: {
                    x: vscaleBounds.right ,
                    y: vscaleBounds.top
                },
                end: {
                    x: vscaleBounds.right,
                    y: vscaleBounds.bottom
                }
            },
            horizontalLine: {
                start: {
                    x: hscaleBounds.left,
                    y: hscaleBounds.bottom
                },
                end: {
                    x: hscaleBounds.right,
                    y: hscaleBounds.bottom
                }
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
