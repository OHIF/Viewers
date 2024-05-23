import { utils } from '@ohif/core';

/**
 * Generates a URL that can be used for direct retrieve of the bulkdata.
 *
 * @param {object} config - The configuration object.
 * @param {object} params - The parameters object.
 * @param {string} params.tag - The tag name of the URL to retrieve.
 * @param {string} params.defaultPath - The path for the pixel data URL.
 * @param {object} params.instance - The instance object that the tag is in.
 * @param {string} params.defaultType - The mime type of the response.
 * @param {string} params.singlepart - The type of the part to retrieve.
 * @param {string} params.fetchPart - Unknown.
 * @returns {string|Promise<string>} - An absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
 *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI.
 */
const getBulkdataValue = (config, params) => {
  const { singlepart } = config;
  const {
    instance,
    tag = 'PixelData',
    defaultPath = '/pixeldata',
    defaultType = 'video/mp4',
    singlepart: fetchPart = 'video',
  } = params;

  const value = instance[tag];
  if (!value) {
    return undefined;
  }

  if (value.DirectRetrieveURL) {
    return value.DirectRetrieveURL;
  }

  if (value.InlineBinary) {
    const blob = utils.b64toBlob(value.InlineBinary, defaultType);
    value.DirectRetrieveURL = URL.createObjectURL(blob);
    return value.DirectRetrieveURL;
  }

  if (!singlepart || (singlepart !== true && singlepart.indexOf(fetchPart) === -1)) {
    if (value.retrieveBulkData) {
      // Try the specified retrieve type.
      const options = {
        mediaType: defaultType,
      };
      return value.retrieveBulkData(options).then(arr => {
        value.DirectRetrieveURL = URL.createObjectURL(new Blob([arr], { type: defaultType }));
        return value.DirectRetrieveURL;
      });
    }
    console.warn('Unable to retrieve', tag, 'from', instance);
    return undefined;
  }

  const { SeriesInstanceUID, SOPInstanceUID } = instance;
  const BulkDataURI =
    (value && value.BulkDataURI) ||
    `series/${SeriesInstanceUID}/instances/${SOPInstanceUID}${defaultPath}`;
  const hasQuery = BulkDataURI.indexOf('?') !== -1;
  const hasAccept = BulkDataURI.indexOf('accept=') !== -1;
  const acceptUri =
    BulkDataURI + (hasAccept ? '' : (hasQuery ? '&' : '?') + `accept=${defaultType}`);

  // The DICOMweb standard states that the default is multipart related, and then
  // separately states that the accept parameter is the URL parameter equivalent of the accept header.
  return acceptUri;
};

export default getBulkdataValue;
