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
  const {
    instance,
    tag = 'PixelData',
    defaultPath = '/pixeldata',
    defaultType = 'video/mp4',
  } = params;

  const value = instance[tag];

  const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;

  const BulkDataURI =
    (value && value.BulkDataURI) ||
    `series/${SeriesInstanceUID}/instances/${SOPInstanceUID}${defaultPath}`;
  const hasQuery = BulkDataURI.indexOf('?') !== -1;
  const hasAccept = BulkDataURI.indexOf('accept=') !== -1;
  const acceptUri =
    BulkDataURI + (hasAccept ? '' : (hasQuery ? '&' : '?') + `accept=${defaultType}`);

  if (acceptUri.startsWith('series/')) {
    const { wadoRoot } = config;
    return `${wadoRoot}/studies/${StudyInstanceUID}/${acceptUri}`;
  }

  // The DICOMweb standard states that the default is multipart related, and then
  // separately states that the accept parameter is the URL parameter equivalent of the accept header.
  return acceptUri;
};

export default getBulkdataValue;
