/**
 * This function disables reference lines for a specific viewport element.
 * It also enables reference lines for all other viewports with the 
 * class .imageViewerViewport.
 *
 * @param element {node} DOM Node representing the viewport element
 */
displayReferenceLines = function(element) {
    log.info("imageViewerViewport displayReferenceLines");

    // Disable reference lines for the current element
    cornerstoneTools.referenceLines.tool.disable(element);

    // Loop through all other viewport elements and enable reference lines
    $('.imageViewerViewport').not(element).each(function(index, element) {
        var imageId;
        try {
            var enabledElement = cornerstone.getEnabledElement(element);
            imageId = enabledElement.image.imageId;
        } catch(error) {
            return;
        }

        if (!imageId || !$(this).find('canvas').length) {
            return;
        }

        cornerstoneTools.referenceLines.tool.enable(element, OHIF.viewer.updateImageSynchronizer);
    });
};