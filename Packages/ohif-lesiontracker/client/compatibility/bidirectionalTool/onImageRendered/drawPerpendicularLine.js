import { cornerstone } from 'meteor/ohif:cornerstone';

// draw perpendicular line
export default function(context, eventData, element, data, color, lineWidth) {
    let startX, startY, endX, endY;

    if (data.handles.start.x === data.handles.end.x &&
        data.handles.start.y === data.handles.end.y) {
        startX = data.handles.start.x;
        startY = data.handles.start.y;
        endX = data.handles.end.x;
        endY = data.handles.end.y;
    } else {
        // mid point of long-axis line
        const mid = {
            x: (data.handles.start.x + data.handles.end.x) / 2,
            y: (data.handles.start.y + data.handles.end.y) / 2
        };

        // Length of long-axis
        const dx = (data.handles.start.x - data.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
        const dy = (data.handles.start.y - data.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
        const length = Math.sqrt(dx * dx + dy * dy);

        const vectorX = (data.handles.start.x - data.handles.end.x) / length;
        const vectorY = (data.handles.start.y - data.handles.end.y) / length;

        const perpendicularLineLength = length / 2;

        startX = mid.x + (perpendicularLineLength / 2) * vectorY;
        startY = mid.y - (perpendicularLineLength / 2) * vectorX;
        endX = mid.x - (perpendicularLineLength / 2) * vectorY;
        endY = mid.y + (perpendicularLineLength / 2) * vectorX;
    }

    if (data.handles.perpendicularStart.locked) {
        data.handles.perpendicularStart.x = startX;
        data.handles.perpendicularStart.y = startY;
        data.handles.perpendicularEnd.x = endX;
        data.handles.perpendicularEnd.y = endY;
    }

    // Draw perpendicular line
    const perpendicularStartCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
    const perpendicularEndCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularEnd);

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.moveTo(perpendicularStartCanvas.x, perpendicularStartCanvas.y);
    context.lineTo(perpendicularEndCanvas.x, perpendicularEndCanvas.y);
    context.stroke();

}
