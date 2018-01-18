import { OHIF } from 'meteor/ohif:core';

OHIF.cornerstone.scaleOverlaySettings = {
    color: 'white',
    lineWidth: 2,
    shadowColor: 'black',
    shadowBlur: 4
};

function drawLine(context, startPoint, endPoint, config) {
    context.moveTo(startPoint.x, startPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
}

function drawVerticalScalebarIntervals (context, config) {
    let i = 0;

    while (config.verticalLine.start.y + i * config.verticalMinorTick <= config.vscaleBounds.bottomRight.y) {

        const startPoint = {
            x: config.verticalLine.start.x,
            y: config.verticalLine.start.y + i * config.verticalMinorTick
        };

        const endPoint = {
            x: 0,
            y: config.verticalLine.start.y + i * config.verticalMinorTick
        };
        if (i % 5 === 0) {

            endPoint.x = config.verticalLine.start.x - config.majorTickLength;
        } else {

            endPoint.x = config.verticalLine.start.x - config.minorTickLength;
        }

        drawLine(context, startPoint, endPoint, config);

        i++;
    }
}

function drawHorizontalScalebarIntervals (context, config) {
    let i = 0;

    while (config.horizontalLine.start.x + i * config.horizontalMinorTick <= config.hscaleBounds.bottomRight.x) {

        const startPoint = {
            x: config.horizontalLine.start.x + i * config.horizontalMinorTick,
            y: config.horizontalLine.start.y
        };

        const endPoint = {
            x: config.horizontalLine.start.x + i * config.horizontalMinorTick,
            y: 0
        };

        if (i % 5 === 0) {
            endPoint.y = config.horizontalLine.start.y - config.majorTickLength;
        } else {
            endPoint.y = config.horizontalLine.start.y - config.minorTickLength;
        }

        drawLine(context, startPoint, endPoint, config);

        i++;
    }
}

function drawVerticalScalebar(context, config) {
    const startPoint = {
        x: config.verticalLine.start.x,
        y: config.verticalLine.start.y
    };
    const endPoint = {
        x: config.verticalLine.end.x,
        y: config.verticalLine.end.y
    };

    context.beginPath();
    context.strokeStyle = config.color;
    context.lineWidth = config.lineWidth;

    drawLine(context, startPoint, endPoint, config);
    drawVerticalScalebarIntervals(context, config);

    context.stroke();
}

function drawHorizontalScalebar(context, config) {
    const startPoint = {
        x: config.horizontalLine.start.x,
        y: config.horizontalLine.start.y
    };
    const endPoint = {
        x: config.horizontalLine.end.x,
        y: config.horizontalLine.end.y
    };

    drawLine(context, startPoint, endPoint, config);
    drawHorizontalScalebarIntervals(context, config);
}

function drawScalebars(context, config){
    context.shadowColor = config.shadowColor;
    context.shadowBlur = config.shadowBlur;
    context.strokeStyle = config.color;
    context.lineWidth = config.lineWidth;

    context.beginPath();
    drawVerticalScalebar(context, config);
    drawHorizontalScalebar(context, config);
    context.stroke();
}

// Computes the max bound for scales on the image
function computeScaleBounds(eventData, canvasSize, imageSize, horizontalReduction, verticalReduction) {

    let canvasBounds = {
        left: 0,
        top: 0,
        width: canvasSize.width,
        height: canvasSize.height
    };

    const hReduction = horizontalReduction * Math.min(1000, canvasSize.width);
    const vReduction = verticalReduction * Math.min(1000, canvasSize.height);
    canvasBounds = {
        left: canvasBounds.left + hReduction,
        top: canvasBounds.top + vReduction,
        width: canvasBounds.width - 2 * hReduction,
        height: canvasBounds.height - 2 * vReduction
    };

    return {
        topLeft: {
            x: canvasBounds.left,
            y: canvasBounds.top
        },
        bottomRight: {
            x: canvasBounds.left + canvasBounds.width,
            y: canvasBounds.top + canvasBounds.height
        }
    };
}

function onImageRendered(e, eventData) {

    // Check whether pixel spacing is defined
    if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
        return;
    }

    const viewport = cornerstone.getViewport(eventData.enabledElement.element);
    if (!viewport) {
        return;
    }

    const canvasSize = {
        width: eventData.enabledElement.canvas.width,
        height: eventData.enabledElement.canvas.height
    };
    const imageSize = {
        width: eventData.enabledElement.image.width ,
        height: eventData.enabledElement.image.height
    };

    // Distance between intervals is 10mm
    const verticalIntervalScale = (10.0 / eventData.enabledElement.image.rowPixelSpacing) * eventData.viewport.scale;
    const horizontalIntervalScale = (10.0 / eventData.enabledElement.image.rowPixelSpacing) * eventData.viewport.scale;

    // 0.1 and 0.05 gives margin to horizontal and vertical lines
    const hscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.25, 0.05);
    const vscaleBounds = computeScaleBounds(eventData, canvasSize, imageSize, 0.05, 0.15);

    if (!canvasSize.width || !canvasSize.height || !imageSize.width || !imageSize.height || !hscaleBounds || !vscaleBounds) {
        return;
    }

    const config = {
        hscaleBounds,
        vscaleBounds,
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
        ...OHIF.cornerstone.scaleOverlaySettings
    };

    const context = eventData.enabledElement.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.save();

    drawScalebars(context, config);
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
