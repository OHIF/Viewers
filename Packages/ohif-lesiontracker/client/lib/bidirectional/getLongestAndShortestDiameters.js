export default function(handles, image={}) {
    // Calculate the long axis length
    const dx = (handles.start.x - handles.end.x) * (image.columnPixelSpacing || 1);
    const dy = (handles.start.y - handles.end.y) * (image.rowPixelSpacing || 1);
    const length = Math.sqrt(dx * dx + dy * dy) || 0;

    // Calculate the short axis length
    const wx = (handles.perpendicularStart.x - handles.perpendicularEnd.x) * (image.columnPixelSpacing || 1);
    const wy = (handles.perpendicularStart.y - handles.perpendicularEnd.y) * (image.rowPixelSpacing || 1);
    const width = Math.sqrt(wx * wx + wy * wy) || 0;

    return {
        longestDiameter: length.toFixed(1),
        shortestDiameter: width.toFixed(1)
    };
}
