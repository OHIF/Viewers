
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // Draw Intervals
    function drawIntervals (context, config) {

        var i = 0;

        while (config.verticalLine.start.y + i * config.verticalMinorTick <= config.vscaleBounds.bottomRight.y) {

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

        while (config.horizontalLine.start.x + i * config.horizontalMinorTick <= config.hscaleBounds.bottomRight.x) {

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

    // Computes the max bound for scales on the image
    function computeScaleBounds(eventData, canvasSize, imageSize, horizontalReduction, verticalReduction) {

        var canvasBounds = {
            left: 0,
            top: 0,
            width: canvasSize.width,
            height: canvasSize.height
        };

        var hReduction = horizontalReduction * Math.min(1000, canvasSize.width);
        var vReduction = verticalReduction * Math.min(1000, canvasSize.height);
        canvasBounds = {
            left: canvasBounds.left + hReduction,
            top: canvasBounds.top + vReduction,
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
            width: imageBoundsWidth - 2 * hReduction,
            height: imageBoundsHeight - 2 * vReduction
        };

        return cornerstoneMath.rect.getIntersectionRect(canvasBounds, imageBounds);

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

        // 0.1 and 0.05 gives margin to horizontal and vertical lines
        var hscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.1, 0.05);
        var vscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.05, 0.1);

        if (!canvasSize.width || !canvasSize.height || !imageSize.width || !imageSize.height || !hscaleBounds || !vscaleBounds) {
            return;
        }

        var config = {
            hscaleBounds: hscaleBounds,
            vscaleBounds: vscaleBounds,
            verticalMinorTick: verticalIntervalScale,
            horizontalMinorTick: horizontalIntervalScale,
            minorTickLength: 12.5,
            majorTickLength: 25,
            verticalLine: {
                start: {
                    x: vscaleBounds.bottomRight.x,
                    y: vscaleBounds.topLeft.y
                },
                end: {
                    x: vscaleBounds.bottomRight.x,
                    y: vscaleBounds.bottomRight.y
                }
            },
            horizontalLine: {
                start: {
                    x: hscaleBounds.topLeft.x,
                    y: hscaleBounds.bottomRight.y
                },
                end: {
                    x: hscaleBounds.bottomRight.x,
                    y: hscaleBounds.bottomRight.y
                }
            },
            color: 'white', // TODO: fix this later
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
