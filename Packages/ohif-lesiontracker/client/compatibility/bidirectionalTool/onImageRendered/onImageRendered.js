import { cornerstone, cornerstoneMath, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { toolType } from '../definitions';
import drawHandles from './drawHandles';
import updatePerpendicularLineHandles from '../updatePerpendicularLineHandles';
import drawPerpendicularLine from './drawPerpendicularLine';
import drawSelectedMarker from './drawSelectedMarker';

export default function(event) {
    const eventData = event.detail;
    const { element, canvasContext } = eventData;

    // if we have no toolData for this element, return immediately as there is nothing to do
    const toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) return;

    const imagePlane = cornerstone.metaData.get('imagePlaneModule', eventData.image.imageId);
    let rowPixelSpacing;
    let colPixelSpacing;

    if (imagePlane) {
        rowPixelSpacing = imagePlane.rowPixelSpacing || imagePlane.rowImagePixelSpacing;
        colPixelSpacing = imagePlane.columnPixelSpacing || imagePlane.colImagePixelSpacing;
    } else {
        rowPixelSpacing = eventData.image.rowPixelSpacing;
        colPixelSpacing = eventData.image.columnPixelSpacing;
    }

    // LT-29 Disable Target Measurements when pixel spacing is not available
    if (!rowPixelSpacing || !colPixelSpacing) {
        return;
    }

    // we have tool data for this element - iterate over each one and draw it
    const context = canvasContext.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);

    let color;
    const lineWidth = cornerstoneTools.toolStyle.getToolWidth();
    const config = cornerstoneTools[toolType].getConfiguration();

    for (let i = 0; i < toolData.data.length; i++) {
        const data = toolData.data[i];
        const { start, end, perpendicularStart, perpendicularEnd, textBox } = data.handles;
        const strokeWidth = lineWidth;

        context.save();

        // configurable shadow from CornerstoneTools
        const { shadow } = config;
        if (shadow && shadow.shadow) {
            context.shadowColor = shadow.shadowColor || '#000000';
            context.shadowOffsetX = shadow.shadowOffsetX || 1;
            context.shadowOffsetY = shadow.shadowOffsetY || 1;
        }

        const activeColor = cornerstoneTools.toolColors.getActiveColor();
        if (data.active) {
            color = activeColor;
        } else {
            color = cornerstoneTools.toolColors.getToolColor();
        }

        // draw the line
        const handleStartCanvas = cornerstone.pixelToCanvas(element, start);
        const handleEndCanvas = cornerstone.pixelToCanvas(element, end);
        const canvasTextLocation = cornerstone.pixelToCanvas(element, textBox);

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
        context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
        context.stroke();

        // Draw perpendicular line
        updatePerpendicularLineHandles(eventData, data);
        drawPerpendicularLine(context, element, data, color, strokeWidth);

        // Draw the handles
        const handlesColor = color;
        drawHandles(context, eventData, data.handles, handlesColor, { drawHandlesIfActive: true });

        // Draw the selected marker
        drawSelectedMarker(eventData, data.handles, '#FF9999');

        // Calculate the long axis length
        const dx = (start.x - end.x) * (colPixelSpacing || 1);
        const dy = (start.y - end.y) * (rowPixelSpacing || 1);
        let length = Math.sqrt(dx * dx + dy * dy);

        // Calculate the short axis length
        const wx = (perpendicularStart.x - perpendicularEnd.x) * (colPixelSpacing || 1);
        const wy = (perpendicularStart.y - perpendicularEnd.y) * (rowPixelSpacing || 1);
        let width = Math.sqrt(wx * wx + wy * wy);
        if (!width) {
            width = 0;
        }

        // Length is always longer than width
        if (width > length) {
            const tempW = width;
            const tempL = length;
            length = tempW;
            width = tempL;
        }

        if (data.measurementNumber) {
            // Draw the textbox
            let suffix = ' mm';
            if (!rowPixelSpacing || !colPixelSpacing) {
                suffix = ' pixels';
            }

            const lengthText = ' L ' + length.toFixed(1) + suffix;
            const widthText = ' W ' + width.toFixed(1) + suffix;
            const textLines = [`Target ${data.measurementNumber}`, lengthText, widthText];

            const boundingBox = cornerstoneTools.drawTextBox(
                context,
                textLines,
                canvasTextLocation.x,
                canvasTextLocation.y,
                color,
                config.textBox
            );

            textBox.boundingBox = boundingBox;

            OHIF.cornerstone.repositionTextBox(eventData, data, config.textBox);

            // Draw linked line as dashed
            const link = {
                start: {},
                end: {}
            };

            const midpointCanvas = {
                x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
                y: (handleStartCanvas.y + handleEndCanvas.y) / 2,
            };

            const points = [ handleStartCanvas, handleEndCanvas, midpointCanvas ];

            link.end.x = canvasTextLocation.x;
            link.end.y = canvasTextLocation.y;

            link.start = cornerstoneMath.point.findClosestPoint(points, link.end);

            const boundingBoxPoints = [ {
                    // Top middle point of bounding box
                    x: boundingBox.left + boundingBox.width / 2,
                    y: boundingBox.top
                }, {
                    // Left middle point of bounding box
                    x: boundingBox.left,
                    y: boundingBox.top + boundingBox.height / 2
                }, {
                    // Bottom middle point of bounding box
                    x: boundingBox.left + boundingBox.width / 2,
                    y: boundingBox.top + boundingBox.height
                }, {
                    // Right middle point of bounding box
                    x: boundingBox.left + boundingBox.width,
                    y: boundingBox.top + boundingBox.height / 2
                },
            ];

            link.end = cornerstoneMath.point.findClosestPoint(boundingBoxPoints, link.start);
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.setLineDash([ 2, 3 ]);

            context.moveTo(link.start.x, link.start.y);
            context.lineTo(link.end.x, link.end.y);
            context.stroke();
        }

        // Set measurement text to show lesion table
        data.longestDiameter = length.toFixed(1);
        data.shortestDiameter = width.toFixed(1);

        context.restore();
    }
}
