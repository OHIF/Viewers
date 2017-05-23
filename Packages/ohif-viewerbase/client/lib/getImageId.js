import { getWADORSImageId } from './getWADORSImageId';

// https://stackoverflow.com/a/6021027/3895126
function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return uri + separator + key + "=" + value;
    }
}

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
        if (frame !== undefined) {
            instance.url = updateQueryStringParameter(instance.url, 'frame', frame);
        }

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
