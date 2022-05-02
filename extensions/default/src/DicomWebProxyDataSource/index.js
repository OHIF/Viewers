import { IWebApiDataSource } from '@ohif/core';
import { createDicomWebApi } from '../DicomWebDataSource/index';

function createDicomWebProxyApi(
  dicomWebProxyConfig,
  UserAuthenticationService
) {
  const { name } = dicomWebProxyConfig;
  let dicomWebDelegate = undefined;

  const implementation = {
    initialize: async ({ params, query, url }) => {
      let studyInstanceUIDs = [];

      if (!url) url = query.get('url');

      if (!url) {
        console.error(`No url for '${name}'`);
      } else {
        const response = await fetch(url);
        let data = await response.json();

        // there seem to be a couple of variations of the case for this parameter
        const queryStudyInstanceUIDs =
          query.get('studyInstanceUIDs') || query.get('studyInstanceUids');
        if (!queryStudyInstanceUIDs) {
          console.error(`No studyInstanceUids in request for '${name}'`);
        }
        if (data.servers && queryStudyInstanceUIDs) {
          dicomWebDelegate = createDicomWebApi(
            data.servers.dicomWeb[0],
            UserAuthenticationService
          );
          studyInstanceUIDs = queryStudyInstanceUIDs.split(';');
        }
      }
      return studyInstanceUIDs;
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
          dicomWebDelegate.query.instances.search(
            studyInstanceUid,
            queryParameters
          ),
      },
    },
    retrieve: {
      directURL: (...args) => dicomWebDelegate.retrieve.directURL(...args),
      series: {
        metadata: (...args) =>
          dicomWebDelegate.retrieve.series.metadata(...args),
      },
    },
    store: {
      dicom: (...args) => dicomWebDelegate.store(...args),
    },
    deleteStudyMetadataPromise: (...args) =>
      dicomWebDelegate.deleteStudyMetadataPromise(...args),
    getImageIdsForDisplaySet: (...args) =>
      dicomWebDelegate.getImageIdsForDisplaySet(...args),
    getImageIdsForInstance: (...args) =>
      dicomWebDelegate.getImageIdsForInstance(...args),
  };
  return IWebApiDataSource.create(implementation);
}

export { createDicomWebProxyApi };
