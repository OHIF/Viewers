import { errorHandler, DicomMetadataStore } from '@ohif/core';
import { StaticWadoClient } from '@ohif/extension-default';

/**
 * create a DICOMwebClient object to be used by Dicom Microscopy Viewer
 *
 * Referenced the code from `/extensions/default/src/DicomWebDataSource/index.js`
 *
 * @param param0
 * @returns
 */
export default function getDicomWebClient({ extensionManager, servicesManager }: withAppTypes) {
  const dataSourceConfig = window.config.dataSources.find(
    ds => ds.sourceName === extensionManager.activeDataSourceName
  );
  const { userAuthenticationService } = servicesManager.services;

  const { wadoRoot, staticWado, singlepart } = dataSourceConfig.configuration;

  const wadoConfig = {
    url: wadoRoot || '/dicomlocal',
    staticWado,
    singlepart,
    headers: userAuthenticationService.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };

  const client = new StaticWadoClient(wadoConfig);
  client.wadoURL = wadoConfig.url;

  if (extensionManager.activeDataSourceName === 'dicomlocal') {
    /**
     * For local data source, override the retrieveInstanceFrames() method of the
     * dicomweb-client to retrieve image data from memory cached metadata.
     * Other methods of the client doesn't matter, as we are feeding the DMV
     * with the series metadata already.
     *
     * @param {Object} options
     * @param {String} options.studyInstanceUID - Study Instance UID
     * @param {String} options.seriesInstanceUID - Series Instance UID
     * @param {String} options.sopInstanceUID - SOP Instance UID
     * @param {String} options.frameNumbers - One-based indices of Frame Items
     * @param {Object} [options.queryParams] - HTTP query parameters
     * @returns {ArrayBuffer[]} Rendered Frame Items as byte arrays
     */
    //
    client.retrieveInstanceFrames = async options => {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required for retrieval of instance frames');
      }
      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required for retrieval of instance frames');
      }
      if (!('sopInstanceUID' in options)) {
        throw new Error('SOP Instance UID is required for retrieval of instance frames');
      }
      if (!('frameNumbers' in options)) {
        throw new Error('frame numbers are required for retrieval of instance frames');
      }
      console.log(
        `retrieve frames ${options.frameNumbers.toString()} of instance ${options.sopInstanceUID}`
      );

      const instance = DicomMetadataStore.getInstance(
        options.studyInstanceUID,
        options.seriesInstanceUID,
        options.sopInstanceUID
      );

      const frameNumbers = Array.isArray(options.frameNumbers)
        ? options.frameNumbers
        : options.frameNumbers.split(',');

      return frameNumbers.map(fr =>
        Array.isArray(instance.PixelData) ? instance.PixelData[+fr - 1] : instance.PixelData
      );
    };
  }

  return client;
}
