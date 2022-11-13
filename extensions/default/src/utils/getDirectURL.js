import {
  DicomMetadataStore,
  IWebApiDataSource,
  utils,
  errorHandler,
  classes,
} from '@ohif/core';

/**
 * Generates a URL that can be used for direct retrieve of the bulkdata
 *
 * @param {object} params
 * @param {string} params.tag is the tag name of the URL to retrieve
 * @param {string} params.defaultPath path for the pixel data url
 * @param {object} params.instance is the instance object that the tag is in
 * @param {string} params.defaultType is the mime type of the response
 * @param {string} params.singlepart is the type of the part to retrieve
 * @param {string} params.fetchPart unknown?
 * @returns an absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
 *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI
 */
const getDirectURL = (wadoRoot, params) => {
  const {
    instance,
    tag = 'PixelData',
    defaultPath = '/pixeldata',
    defaultType = 'video/mp4',
    singlepart = null,
    singlepart: fetchPart = 'video',
  } = params;
  const value = instance[tag];
  if (!value) return undefined;

  if (value.DirectRetrieveURL) return value.DirectRetrieveURL;
  if (value.InlineBinary) {
    const blob = utils.b64toBlob(value.InlineBinary, defaultType);
    value.DirectRetrieveURL = URL.createObjectURL(blob);
    return value.DirectRetrieveURL;
  }
  if (
    !singlepart ||
    (singlepart !== true && singlepart.indexOf(fetchPart) === -1)
  ) {
    if (value.retrieveBulkData) {
      return value.retrieveBulkData().then(arr => {
        value.DirectRetrieveURL = URL.createObjectURL(
          new Blob([arr], { type: defaultType })
        );
        return value.DirectRetrieveURL;
      });
    }
    console.warn('Unable to retrieve', tag, 'from', instance);
    return undefined;
  }

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
  } = instance;
  const BulkDataURI =
    (value && value.BulkDataURI) ||
    `series/${SeriesInstanceUID}/instances/${SOPInstanceUID}${defaultPath}`;
  const hasQuery = BulkDataURI.indexOf('?') != -1;
  const hasAccept = BulkDataURI.indexOf('accept=') != -1;
  const acceptUri =
    BulkDataURI +
    (hasAccept ? '' : (hasQuery ? '&' : '?') + `accept=${defaultType}`);
  if (BulkDataURI.indexOf('http') === 0) return acceptUri;
  if (BulkDataURI.indexOf('/') === 0) {
    return wadoRoot + acceptUri;
  }
  if (BulkDataURI.indexOf('series/') == 0) {
    return `${wadoRoot}/studies/${StudyInstanceUID}/${acceptUri}`;
  }
  if (BulkDataURI.indexOf('instances/') === 0) {
    return `${wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/${acceptUri}`;
  }
  if (BulkDataURI.indexOf('bulkdata/') === 0) {
    return `${wadoRoot}/studies/${StudyInstanceUID}/${acceptUri}`;
  }
  throw new Error('BulkDataURI in unknown format:' + BulkDataURI);
};

export default getDirectURL;
