import { OHIF } from 'meteor/ohif:core';

OHIF.cornerstone = {};

OHIF.cornerstone.pixelToPage = (element, position) => {
    const enabledElement = cornerstone.getEnabledElement(element);
    const result = {
        x: 0,
        y: 0
    };

    // Stop here if the cornerstone element is not enabled or position is not an object
    if (!enabledElement || typeof position !== 'object') {
        return result;
    }

    const canvas = enabledElement.canvas;

    const canvasOffset = $(canvas).offset();
    result.x += canvasOffset.left;
    result.y += canvasOffset.top;

    const canvasPosition = cornerstone.pixelToCanvas(element, position);
    result.x += canvasPosition.x;
    result.y += canvasPosition.y;

    return result;
};
