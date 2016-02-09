pixelSpacingAutorunCheck = function() {
    log.info('lesionTool button change autorun');

    // Get oncology tools
    var oncologyTools = $('button#lesion, button#nonTarget');

    // TODO: Set activeViewport for empty viewport element
    var activeViewportIndex = Session.get('activeViewport');
    if (activeViewportIndex === undefined) {
        return;
    }

    var element = $('.imageViewerViewport').get(activeViewportIndex);
    if (!element) {
        return;
    }

    var enabledElement = cornerstone.getEnabledElement(element);

    // Check value of rowPixelSpacing & columnPixelSpacing to define as unavailable
    if (!enabledElement ||
        !enabledElement.image ||
        !enabledElement.image.rowPixelSpacing ||
        !enabledElement.image.columnPixelSpacing) {
        // Disable Lesion Buttons
        oncologyTools.prop('disabled', true);
    } else {
        // Enable Lesion Buttons
        oncologyTools.prop('disabled', false);
    }
};