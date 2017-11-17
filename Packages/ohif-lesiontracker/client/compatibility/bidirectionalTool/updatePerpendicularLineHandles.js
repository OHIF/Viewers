// Update the  perpendicular line handles
export default function(eventData, data) {
    if (!data.handles.perpendicularStart.locked) return;

    let startX, startY, endX, endY;

    const { start, end } = data.handles;
    if (start.x === end.x && start.y === end.y) {
        startX = start.x;
        startY = start.y;
        endX = end.x;
        endY = end.y;
    } else {
        // mid point of long-axis line
        const mid = {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2
        };

        // Length of long-axis
        const dx = (start.x - end.x) * (eventData.image.columnPixelSpacing || 1);
        const dy = (start.y - end.y) * (eventData.image.rowPixelSpacing || 1);
        const length = Math.sqrt(dx * dx + dy * dy);

        const vectorX = (start.x - end.x) / length;
        const vectorY = (start.y - end.y) / length;

        const perpendicularLineLength = length / 2;

        startX = mid.x + (perpendicularLineLength / 2) * vectorY;
        startY = mid.y - (perpendicularLineLength / 2) * vectorX;
        endX = mid.x - (perpendicularLineLength / 2) * vectorY;
        endY = mid.y + (perpendicularLineLength / 2) * vectorX;
    }

    data.handles.perpendicularStart.x = startX;
    data.handles.perpendicularStart.y = startY;
    data.handles.perpendicularEnd.x = endX;
    data.handles.perpendicularEnd.y = endY;
}
