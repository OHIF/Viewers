import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

// Return the newPosition for the handle based on the mmStep and handles
export default function(image, handles, handleKey, mmStep, mmLimit=1) {
    if (handleKey === 'textBox') return;

    const lib = OHIF.lesiontracker.bidirectional;

    // Defines how much the arm will increase/decrease
    const columnPixelSpacing = (image && image.columnPixelSpacing) || 1;
    const rowPixelSpacing = (image && image.rowPixelSpacing) || 1;
    const stepX = mmStep * (1 / columnPixelSpacing);
    const stepY = mmStep * (1 / rowPixelSpacing);

    // Get the line angle and its handles
    const keyA = handleKey;
    const keyB = lib.inverseKeyMap[handleKey];
    const handleA = handles[keyA];
    const handleB = handles[keyB];
    const angle = Math.atan2(handleA.y - handleB.y, handleA.x - handleB.x);

    // Calculate the new position of the handle
    const newPosition = {
        x: handleA.x + Math.cos(angle) * stepX,
        y: handleA.y + Math.sin(angle) * stepY
    };

    if (mmStep < 0) {
        // Get the perpendicular handles
        const keyC = lib.perpendicularKeyMap[keyA];
        const keyD = lib.perpendicularKeyMap[keyB];
        const handleC = handles[keyC];
        const handleD = handles[keyD];

        // Create the line segment for the arm being resized
        const lineAB = {
            start: _.pick(handleA, ['x', 'y']),
            end: _.pick(handleB, ['x', 'y'])
        };

        // Create the line segment for the perpendicular arm
        const lineCD = {
            start: _.pick(handleC, ['x', 'y']),
            end: _.pick(handleD, ['x', 'y'])
        };

        // Get the intersection point between the arms
        const intersection = cornerstoneMath.lineSegment.intersectLine(lineAB, lineCD);

        // Keep the minimum distance of 0.1 mm to the intersection point
        const dx = (intersection.x - newPosition.x) * columnPixelSpacing;
        const dy = (intersection.y - newPosition.y) * rowPixelSpacing;
        const distance = Math.sqrt((dx * dx) + (dy * dy));
        const newAngle = Math.atan2(newPosition.y - intersection.y, newPosition.x - intersection.x);
        if (angle.toFixed(8) !== newAngle.toFixed(8) || distance < Math.abs(mmLimit)) {
            Object.assign(newPosition, {
                x: intersection.x - Math.cos(angle) * mmLimit * Math.sign(stepX),
                y: intersection.y - Math.sin(angle) * mmLimit * Math.sign(stepY)
            });
        }
    }

    return newPosition;
}
