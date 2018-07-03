import { cornerstone, cornerstoneMath, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { OHIF } from 'meteor/ohif:core';
import { toolType } from '../definitions';
import drawHandles from './drawHandles';
import calculateLongestAndShortestDiameters from '../calculateLongestAndShortestDiameters';
import updatePerpendicularLineHandles from '../updatePerpendicularLineHandles';
import drawPerpendicularLine from './drawPerpendicularLine';
import drawSelectedMarker from './drawSelectedMarker';

export default function onImageRendered(event) {
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
        if (data.visible === false) continue;

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

        // Update the perpendicular handles to draw it correctly
        updatePerpendicularLineHandles(eventData, data);

        // Draw the line
        const { pixelToCanvas } = cornerstone;
        const handleStartCanvas = pixelToCanvas(element, start);
        const handleEndCanvas = pixelToCanvas(element, end);
        const handlePerpendicularStartCanvas = pixelToCanvas(element, perpendicularStart);
        const handlePerpendicularEndCanvas = pixelToCanvas(element, perpendicularEnd);
        const canvasTextLocation = pixelToCanvas(element, textBox);

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
        context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
        context.stroke();

        // Draw perpendicular line
        drawPerpendicularLine(context, element, data, color, strokeWidth);

        // Draw the handles
        const handlesColor = color;
        drawHandles(context, eventData, data.handles, handlesColor, { drawHandlesIfActive: true });

        // Draw the selected marker
        drawSelectedMarker(eventData, data.handles, '#FF9999');

        // Calculate the longest and shortest diameters, storing it in the respective attributes
        calculateLongestAndShortestDiameters(eventData, data);

        if (data.measurementNumber) {
            // Draw the textbox
            let suffix = ' mm';
            if (!rowPixelSpacing || !colPixelSpacing) {
                suffix = ' pixels';
            }

            const lengthText = ' L ' + data.longestDiameter + suffix;
            const widthText = ' W ' + data.shortestDiameter + suffix;
            let textLines = [`Target ${data.measurementNumber}`, lengthText, widthText];

            // Append extra text lines when applies
            if (data.additionalData && Array.isArray(data.additionalData.extraTextLines)) {
                textLines = textLines.concat(data.additionalData.extraTextLines);
            }

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

            const longLine = {
                start: handleStartCanvas,
                end: handleEndCanvas
            };

            const perpendicularLine = {
                start: handlePerpendicularStartCanvas,
                end: handlePerpendicularEndCanvas
            };

            // Check if the perpendicular line has some length (start and end are not equal)
            // Note: this check is needed to prevent NaN value on the intersection result
            const { distance } = cornerstoneMath.point;
            const lineHasLength = distance(perpendicularLine.start, perpendicularLine.end) > 0;

            // Define the lines intersection point
            let linesIntersection;
            if (lineHasLength) {
                // As the line has length, define it as the intersection between the lines
                const { intersectLine } = cornerstoneMath.lineSegment;
                linesIntersection = intersectLine(longLine, perpendicularLine);
            } else {
                // As the line has no length, the tool is in its start position
                linesIntersection = longLine.start;
            }

            const points = [
                handleStartCanvas,
                handleEndCanvas,
                handlePerpendicularStartCanvas,
                handlePerpendicularEndCanvas,
                linesIntersection
            ];

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

        context.restore();
    }
}