import { OHIF } from 'meteor/ohif:core';

/**
 * This function disables reference lines for a specific viewport element.
 * It also enables reference lines for all other viewports with the
 * class .imageViewerViewport.
 *
 * @param element {node} DOM Node representing the viewport element
 */
export function displayReferenceLines(element) {

    // Check if image plane (orientation / loction) data is present for the current image
    const enabledElement = cornerstone.getEnabledElement(element);

    // Check if element is already enabled and it's image was rendered
    if(!enabledElement || !enabledElement.image) {
        OHIF.log.info('displayReferenceLines enabled element is undefined or it\'s image is not rendered');
        return;
    }

    const imageId = enabledElement.image.imageId;
    const imagePlane = cornerstone.metaData.get('imagePlane', imageId);

    // Disable reference lines for the current element
    cornerstoneTools.referenceLines.tool.disable(element);

    if (!OHIF.viewer.refLinesEnabled || !imagePlane || !imagePlane.frameOfReferenceUID) {
        OHIF.log.info('displayReferenceLines refLinesEnabled is not enabled, no imagePlane or no frameOfReferenceUID');
        return;
    }

    OHIF.log.info(`displayReferenceLines for image with id: ${imageId}`);

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
}
