import getWADORSImageId from './getWADORSImageId';

// https://stackoverflow.com/a/6021027/3895126
function updateQueryStringParameter(uri, key, value) {
  const regex = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
  const separator = uri.indexOf('?') !== -1 ? '&' : '?';
  if (uri.match(regex)) {
    return uri.replace(regex, '$1' + key + '=' + value + '$2');
  } else {
    return uri + separator + key + '=' + value;
  }
}

/**
 * Obtain an imageId for Cornerstone from an image instance
 *
 * @param instance
 * @param frame
 * @param thumbnail
 * @returns {string} The imageId to be used by Cornerstone
 */
export default function getImageId(instance, frame, thumbnail = false) {
  if (!instance) {
    return;
  }

  if (typeof instance.getImageId === 'function') {
    return instance.getImageId();
  }

  if (instance.url) {
    if (frame !== undefined) {
      instance.url = updateQueryStringParameter(instance.url, 'frame', frame);
    }

    return instance.url;
  }

  const renderingAttr = thumbnail ? 'thumbnailRendering' : 'imageRendering';

  if (!instance[renderingAttr] || instance[renderingAttr] === 'wadouri' || !instance.wadorsuri) {
    let imageId = 'dicomweb:' + instance.wadouri;
    if (frame !== undefined) {
      imageId += '&frame=' + frame;
    }

    return imageId;
  } else {
    return getWADORSImageId(instance, frame, thumbnail); // WADO-RS Retrieve Frame
  }
}
