import { OHIF } from 'meteor/ohif:core';

/**
 * This function disables reference lines for a specific viewport element.
 * It also enables reference lines for all other viewports with the
 * class .imageViewerViewport.
 *
 * @param element {node} DOM Node representing the viewport element
 */
displayReferenceLines = function(element) {
    log.info("imageViewerViewport displayReferenceLines");

    // Check if image plane (orientation / loction) data is present for the current image
    var enabledElement = cornerstone.getEnabledElement(element);
    var imageId = enabledElement.image.imageId;
    var imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);

    if (!OHIF.viewer.refLinesEnabled || !imagePlane || !imagePlane.frameOfReferenceUID) {
        return;
    }

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
