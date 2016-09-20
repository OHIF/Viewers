import { OHIF } from 'meteor/ohif:core';

/**
 * This function disables reference lines for a specific viewport element.
 * It also enables reference lines for all other viewports with the
 * class .imageViewerViewport.
 *
 * @param element {node} DOM Node representing the viewport element
 */
displayReferenceLines = element => {
    OHIF.log.info("imageViewerViewport displayReferenceLines");

    // Check if image plane (orientation / loction) data is present for the current image
    const enabledElement = cornerstone.getEnabledElement(element);
    const imageId = enabledElement.image.imageId;
    const imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);

    if (!OHIF.viewer.refLinesEnabled || !imagePlane || !imagePlane.frameOfReferenceUID) {
        return;
    }

    // Disable reference lines for the current element
    cornerstoneTools.referenceLines.tool.disable(element);

    // Loop through all other viewport elements and enable reference lines
    $('.imageViewerViewport').not(element).each((index, viewportElement) => {
        let imageId;
        if($(viewportElement).find('canvas').length) {
            try {
                const enabledElement = cornerstone.getEnabledElement(viewportElement);
                imageId = enabledElement.image.imageId;
            } catch(error) {
                return;
            }

            if (!imageId) {
                return;
            }

            cornerstoneTools.referenceLines.tool.enable(viewportElement, OHIF.viewer.updateImageSynchronizer);
        }
    });
};
