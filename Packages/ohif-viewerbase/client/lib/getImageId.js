import { getWADORSImageId } from './getWADORSImageId';

/**
 * Obtain an imageId for Cornerstone from an image instance
 *
 * @param instance
 * @param frame
 * #param thumbnail
 * @returns {string} The imageId to be used by Cornerstone
 */
export function getImageId(instance, frame, thumbnail) {
    if (!instance) {
        return;
    }

    if (instance.url) {
        return instance.url; 
    }

    const renderingAttr = thumbnail ? 'thumbnailRendering' : 'imageRendering';

    if (!instance[renderingAttr] || instance[renderingAttr] === 'wadouri' || !instance.wadorsuri) {
        var imageId = 'dicomweb:' + instance.wadouri;
        if (frame !== undefined) {
            imageId += '&frame=' + frame;
        }

        return imageId;
    } else {
        return getWADORSImageId(instance, frame, thumbnail); // WADO-RS Retrieve Frame
    }
}
