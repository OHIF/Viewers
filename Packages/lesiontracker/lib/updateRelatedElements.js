updateRelatedElements = function(imageId) {
    // Get all on-screen elements with this imageId
    var enabledElements = cornerstone.getEnabledElementsByImageId(imageId);

    // TODO=Check original event to prevent duplicate updateImage calls

    // Loop through these elements
    enabledElements.forEach(function(enabledElement) {
        // Update the display so the tool is removed
        var element = enabledElement.element;
        cornerstone.updateImage(element);
    });
};
