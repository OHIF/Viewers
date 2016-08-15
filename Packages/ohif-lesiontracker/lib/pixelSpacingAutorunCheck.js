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

    try {
        var enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return;
    }

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