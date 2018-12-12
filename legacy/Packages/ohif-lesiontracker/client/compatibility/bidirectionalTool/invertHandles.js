const swapAttribute = (a, b, attribute) => {
    const originalA = a[attribute];
    const originalB = b[attribute];
    a[attribute] = originalB;
    b[attribute] = originalA;
};

const swapHandles = (a, b) => {
    swapAttribute(a, b, 'x');
    swapAttribute(a, b, 'y');
    swapAttribute(a, b, 'moving');
    swapAttribute(a, b, 'hover');
    swapAttribute(a, b, 'active');
    swapAttribute(a, b, 'selected');
};

function invertHandles(eventData, measurementData, handle) {
    const { rowPixelSpacing, columnPixelSpacing } = eventData.image;
    const { handles } = measurementData;
    const { start, end, perpendicularStart, perpendicularEnd } = handles;

    // Calculate the long axis length
    const dx = (start.x - end.x) * (columnPixelSpacing || 1);
    const dy = (start.y - end.y) * (rowPixelSpacing || 1);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Calculate the short axis length
    const wx = (perpendicularStart.x - perpendicularEnd.x) * (columnPixelSpacing || 1);
    const wy = (perpendicularStart.y - perpendicularEnd.y) * (rowPixelSpacing || 1);
    const width = Math.sqrt(wx * wx + wy * wy) || 0;

    if (width > length) {
        swapHandles(start, end);
        swapHandles(start, perpendicularStart);
        swapHandles(end, perpendicularEnd);
        return Object.values(handles).find(h => h.moving === true);
    }

    return handle;
}

export default invertHandles;
