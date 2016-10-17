import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

OHIF.lesiontracker.pixelSpacingAutorunCheck = () => {
    OHIF.log.info('lesionTool button change autorun');

    // Get oncology tools
    const $oncologyTools = $('button#lesion, button#nonTarget');

    // TODO: Set activeViewport for empty viewport element
    const activeViewportIndex = Session.get('activeViewport');
    if (activeViewportIndex === undefined) {
        return;
    }

    const element = $('.imageViewerViewport').get(activeViewportIndex);
    if (!element) {
        return;
    }

    let enabledElement;
    try {
        enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return;
    }

    // Check value of rowPixelSpacing & columnPixelSpacing to define as unavailable
    if (!enabledElement ||
        !enabledElement.image ||
        !enabledElement.image.rowPixelSpacing ||
        !enabledElement.image.columnPixelSpacing) {
        // Disable Lesion Buttons
        $oncologyTools.prop('disabled', true);
    } else {
        // Enable Lesion Buttons
        $oncologyTools.prop('disabled', false);
    }

};
