import { cornerstone } from 'meteor/ohif:cornerstone';

// draw perpendicular line
export default function(context, element, data, color, lineWidth) {
    // Draw perpendicular line
    const { perpendicularStart, perpendicularEnd } = data.handles;
    const perpendicularStartCanvas = cornerstone.pixelToCanvas(element, perpendicularStart);
    const perpendicularEndCanvas = cornerstone.pixelToCanvas(element, perpendicularEnd);

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.moveTo(perpendicularStartCanvas.x, perpendicularStartCanvas.y);
    context.lineTo(perpendicularEndCanvas.x, perpendicularEndCanvas.y);
    context.stroke();
}
