/**
 * Helper function to quickly obtain the frameOfReferenceUID
 * for a given element from the enabled image's metadata.
 * 
 * If no image, imagePlane, or frameOfReferenceUID is available,
 * the function will return undefined.
 *
 * @param element
 * @returns {string}
 */
export function getFrameOfReferenceUID(element) {
    var enabledElement;
    try {
        enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return;
    }
    
    if (!enabledElement || !enabledElement.image) {
        return;
    }

    var imageId = enabledElement.image.imageId;
    var imagePlane = cornerstone.metaData.get('imagePlane', imageId);
    if (!imagePlane || !imagePlane.frameOfReferenceUID) {
        return;
    }

    return imagePlane.frameOfReferenceUID;
}
