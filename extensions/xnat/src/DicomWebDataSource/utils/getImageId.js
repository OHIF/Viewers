import getWADORSImageId from './getWADORSImageId';

function buildInstanceWadoUrl(config, instance) {
  const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
  const params = [];

  params.push('requestType=WADO');
  params.push(`studyUID=${StudyInstanceUID}`);
  params.push(`seriesUID=${SeriesInstanceUID}`);
  params.push(`objectUID=${SOPInstanceUID}`);
  params.push('contentType=application/dicom');
  params.push('transferSyntax=*');

  const paramString = params.join('&');
  const baseUrl = config.wadoUriRoot || config.wadoUri || config.wadoRoot;

  return `${baseUrl}?${paramString}`;
}

/**
 * Obtain an imageId for Cornerstone from an image instance
 *
 * @param instance
 * @param frame
 * @param thumbnail
 * @returns {string} The imageId to be used by Cornerstone
 */
export default function getImageId({ instance, frame, config, thumbnail = false }) {
  if (!instance) {
    return;
  }

  if (instance.imageId && frame === undefined) {
    return instance.imageId;
  }

  // For single-frame only: instance.url can be used as shortcut. For multi-frame (Enhanced MR),
  // we must NOT return instance.url here - it's a raw http URL with no scheme prefix and no
  // frame parameter, which causes "No image loader found for scheme 'http'" and wrong frames.
  if (instance.url && frame === undefined) {
    return instance.url;
  }

  // For multi-frame: use the instance's base URL (from imageId or url) and append the frame.
  // Use &frame= (not ?frame=) so OHIF MetadataProvider can parse it - it only handles &frame=
  // for getUIDsFromImageID and getFrameInformationFromURL. Add dummy param if needed.
  if (frame !== undefined) {
    const baseImageId = instance.imageId || (instance.url ? `dicomweb:${instance.url}` : null);
    if (baseImageId) {
      const urlPart = baseImageId.startsWith('dicomweb:') ? baseImageId.substring(9) : baseImageId;
      const separator = urlPart.includes('?') ? '&' : '?_=0&'; // Ensure &frame= for MetadataProvider
      const frameUrl = `${urlPart}${separator}frame=${frame}`;
      return baseImageId.startsWith('dicomweb:') ? `dicomweb:${frameUrl}` : frameUrl;
    }
  }

  const renderingAttr = thumbnail ? 'thumbnailRendering' : 'imageRendering';

  if (!config[renderingAttr] || config[renderingAttr] === 'wadouri') {
    const wadouri = buildInstanceWadoUrl(config, instance);

    let imageId = 'dicomweb:' + wadouri;
    if (frame !== undefined) {
      imageId += '&frame=' + frame;
    }

    return imageId;
  } else {
    return getWADORSImageId(instance, config, frame); // WADO-RS Retrieve Frame
  }
}
