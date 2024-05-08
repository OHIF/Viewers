import { IWebApiDataSource } from '@ohif/core';
import { createDicomWebApi } from '../DicomWebDataSource/index';

/**
 * This datasource is initialized with a url that returns a JSON object with a
 * dicomWeb datasource configuration array present in a "servers" object.
 *
 * Only the first array item is parsed, if there are multiple items in the
 * dicomWeb configuration array
 *
 */
function createDicomWebProxyApi(dicomWebProxyConfig, servicesManager: AppTypes.ServicesManager) {
  const { name } = dicomWebProxyConfig;
  let dicomWebDelegate = undefined;

  const implementation = {
    initialize: async ({ params, query }) => {
      const url = query.get('url');

      if (!url) {
        throw new Error(`No url for '${name}'`);
      } else {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.servers?.dicomWeb?.[0]) {
          throw new Error('Invalid configuration returned by url');
        }

        dicomWebDelegate = createDicomWebApi(
          data.servers.dicomWeb[0].configuration,
          servicesManager
        );
        dicomWebDelegate.initialize({ params, query });
      }
    },
    query: {
      studies: {
        search: params => dicomWebDelegate.query.studies.search(params),
      },
      series: {
        search: (...args) => dicomWebDelegate.query.series.search(...args),
      },
      instances: {
        search: (studyInstanceUid, queryParameters) =>
          dicomWebDelegate.query.instances.search(studyInstanceUid, queryParameters),
      },
    },
    retrieve: {
      directURL: (...args) => dicomWebDelegate.retrieve.directURL(...args),
      series: {
        metadata: async (...args) => dicomWebDelegate.retrieve.series.metadata(...args),
      },
    },
    store: {
      dicom: (...args) => dicomWebDelegate.store(...args),
    },
    deleteStudyMetadataPromise: (...args) => dicomWebDelegate.deleteStudyMetadataPromise(...args),
    getImageIdsForDisplaySet: (...args) => dicomWebDelegate.getImageIdsForDisplaySet(...args),
    getImageIdsForInstance: (...args) => dicomWebDelegate.getImageIdsForInstance(...args),
    getStudyInstanceUIDs({ params, query }) {
      let studyInstanceUIDs = [];

      // there seem to be a couple of variations of the case for this parameter
      const queryStudyInstanceUIDs =
        query.get('studyInstanceUIDs') || query.get('studyInstanceUids');
      if (!queryStudyInstanceUIDs) {
        throw new Error(`No studyInstanceUids in request for '${name}'`);
      }
      studyInstanceUIDs = queryStudyInstanceUIDs.split(';');
      return studyInstanceUIDs;
    },
  };
  return IWebApiDataSource.create(implementation);
}

export { createDicomWebProxyApi };
