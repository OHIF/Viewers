import { api } from 'dicomweb-client';
import { mapParams, search, processResults } from './qido.js';
import { IWebApiDataSource } from '@ohif/core';

/**
 *
 * @param {string} name - Data source name
 * @param {string} wadoUriRoot - Legacy? (potentially unused/replaced)
 * @param {string} qidoRoot - Base URL to use for QIDO requests
 * @param {string} wadoRoot - Base URL to use for WADO requests
 * @param {boolean} qidoSupportsIncludeField - Whether QIDO supports the "Include" option to request additional fields in response
 * @param {string} imageRengering - wadors | ? (unsure of where/how this is used)
 * @param {string} thumbnailRendering - wadors | ? (unsure of where/how this is used)
 * @param {bool} lazyLoadStudy - "enableStudyLazyLoad"; Request series meta async instead of blocking
 */
function createDicomWebApi(dicomWebConfig) {
  const { qidoRoot } = dicomWebConfig;
  const config = {
    url: qidoRoot,
    // headers: DICOMWeb.getAuthorizationHeader(server),
  };

  const dicomWebClient = new api.DICOMwebClient(config);

  return IWebApiDataSource.create({
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: search.bind(undefined, dicomWebClient, null, null),
        processResults: processResults.bind(),
      },
      instances: {
        search: (studyInstanceUid, queryParamaters) =>
          search.call(
            undefined,
            dicomWebClient,
            studyInstanceUid,
            null,
            queryParamaters
          ),
      },
    },
  });
}

export { createDicomWebApi };
