import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

// Draw a line marker over the selected arm
export default function(eventData, handles, color) {
    const lib = OHIF.lesiontracker.bidirectional;
    const { canvasContext, element } = eventData;

    const handleKey = lib.getSelectedHandleKey(handles);
    if (!handleKey) return;
    const handle = handles[handleKey];

    // Used a big distance (1km) to fill the entire line
    const mmStep = -1000000;

    // Get the line's start and end points
    const fakeImage = {
        columnPixelSpacing: eventData.viewport.scale,
        rowPixelSpacing: eventData.viewport.scale
    };
    const pointA = lib.repositionBidirectionalArmHandle(fakeImage, handles, handleKey, mmStep, 0);
    const pointB = _.pick(handle, ['x', 'y']);

    // Stop here if pointA is not present
    if (!pointA) return;

    // Get the canvas coordinates for the line    var perpendicularStartCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
    const canvasPointA = cornerstone.pixelToCanvas(element, pointA);
    const canvasPointB = cornerstone.pixelToCanvas(element, pointB);

    // Draw the line marker
    canvasContext.beginPath();
    canvasContext.strokeStyle = color;
    canvasContext.lineWidth = cornerstoneTools.toolStyle.getToolWidth();
    canvasContext.moveTo(canvasPointA.x, canvasPointA.y);
    canvasContext.lineTo(canvasPointB.x, canvasPointB.y);
    canvasContext.stroke();
}
