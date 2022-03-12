import { api } from 'dicomweb-client';
import {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
} from './qido.js';
import dcm4cheeReject from './dcm4cheeReject';
import {
  DicomMetadataStore,
  IWebApiDataSource,
  utils,
  errorHandler,
} from '@ohif/core';

import getImageId from './utils/getImageId';
import dcmjs from 'dcmjs';
import {
  retrieveStudyMetadata,
  deleteStudyMetadataPromise,
} from './retrieveStudyMetadata.js';
import StaticWadoClient from './utils/StaticWadoClient.js';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;
const { urlUtil } = utils;

const ImplementationClassUID =
  '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-VIEWER-2.0.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

/**
 *
 * @param {string} name - Data source name
 * @param {string} baseUrl - The root URL for DICOMWeb calls
 * @param {string} wadoUrlPrefix - The URL prefix for WADO DICOMWeb calls
 * @param {string} qidoUrlPrefix - The URL prefix for QIDO DICOMWeb calls
 * @param {string} stowUrlPrefix - The URL prefix for STOW DICOMWeb calls
 * @param {bool} qidoSupportsIncludeField - Whether QIDO supports the "Include" option to request additional fields in response
 * @param {bool} enableStudyLazyLoad - Request series meta async instead of blocking
 * @param {bool} supportsWildcard - Whether the server supports wildcards calls (i.e. DCM4CHEE)
 * @param {bool} supportsReject - Whether the server supports reject calls (i.e. DCM4CHEE)
 * @param {bool} staticWado - Wether the DICOMWeb client is a static wado one fot test purposes
 */
function createDicomWebApi(dicomWebConfig, UserAuthenticationService) {
  const {
    baseUrl,
    wadoUrlPrefix,
    qidoUrlPrefix,
    stowUrlPrefix,
    qidoSupportsIncludeField,
    enableStudyLazyLoad,
    supportsFuzzyMatching,
    supportsWildcard,
    supportsReject,
    staticWado,
  } = dicomWebConfig;


  const dicomWebClientConfig = {
    url: baseUrl,
    wadoURLPrefix: wadoUrlPrefix,
    qidoURLPrefix: qidoUrlPrefix,
    stowURLPrefix: stowUrlPrefix,
    headers: UserAuthenticationService.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };

  // TODO -> We'll need to merge auth later.
  const dicomWebClient = staticWado
    ? new StaticWadoClient(dicomWebClientConfig)
    : new api.DICOMwebClient(dicomWebClientConfig);

  const implementation = {
    initialize: ({ params, query }) => {
      const { StudyInstanceUIDs: paramsStudyInstanceUIDs } = params;
      const queryStudyInstanceUIDs = query.get('StudyInstanceUIDs');

      const StudyInstanceUIDs =
        queryStudyInstanceUIDs || paramsStudyInstanceUIDs;
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs];
      return StudyInstanceUIDsAsArray;
    },
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function(origParams) {
          const headers = UserAuthenticationService.getAuthorizationHeader();
          if (headers) {
            dicomWebClient.headers = headers;
          }

          const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
            mapParams(origParams, {
              supportsFuzzyMatching,
              supportsWildcard,
            }) || {};

          const results = await qidoSearch(
            dicomWebClient,
            undefined,
            undefined,
            mappedParams
          );

          return processResults(results);
        },
        processResults: processResults.bind(),
      },
      series: {
        // mapParams: mapParams.bind(),
        search: async function(studyInstanceUid) {
          const headers = UserAuthenticationService.getAuthorizationHeader();
          if (headers) {
            dicomWebClient.headers = headers;
          }

          const results = await seriesInStudy(
            dicomWebClient,
            studyInstanceUid
          );

          return processSeriesResults(results);
        },
        // processResults: processResults.bind(),
      },
      instances: {
        search: (studyInstanceUid, queryParameters) => {
          const headers = UserAuthenticationService.getAuthorizationHeader();
          if (headers) {
            dicomWebClient.headers = headers;
          }

          qidoSearch.call(
            undefined,
            dicomWebClient,
            studyInstanceUid,
            null,
            queryParameters
          );
        },
      },
    },
    retrieve: {
      series: {
        metadata: async ({
          StudyInstanceUID,
          filters,
          sortCriteria,
          sortFunction,
          madeInClient = false,
        } = {}) => {
          const headers = UserAuthenticationService.getAuthorizationHeader();
          if (headers) {
            dicomWebClient.headers = headers;
          }

          if (!StudyInstanceUID) {
            throw new Error(
              'Unable to query for SeriesMetadata without StudyInstanceUID'
            );
          }

          // Get Series
          const {
            seriesSummaryMetadata,
            seriesPromises,
          } = await retrieveStudyMetadata(
            dicomWebClient,
            StudyInstanceUID,
            enableStudyLazyLoad,
            filters,
            sortCriteria,
            sortFunction
          );

          /**
           * naturalizes the dataset, and adds a retrieve bulkdata method
           * to any values containing BulkDataURI.
           * @param {*} instance
           * @returns naturalized dataset, with retrieveBulkData methods
           */
          const addRetrieveBulkData = instance => {
            const naturalized = naturalizeDataset(instance);
            Object.keys(naturalized).forEach(key => {
              const value = naturalized[key];
              // The value.Value will be set with the bulkdata read value
              // in which case it isn't necessary to re-read this.
              if (value && value.BulkDataURI && !value.Value) {
                // Provide a method to fetch bulkdata
                value.retrieveBulkData = () => {
                  const options = {
                    // The bulkdata fetches work with either multipart or
                    // singlepart, so set multipart to false to let the server
                    // decide which type to respond with.
                    multipart: false,
                    BulkDataURI: value.BulkDataURI,
                    // The study instance UID is required if the bulkdata uri
                    // is relative - that isn't disallowed by DICOMweb, but
                    // isn't well specified in the standard, but is needed in
                    // any implementation that stores static copies of the metadata
                    StudyInstanceUID: naturalized.StudyInstanceUID,
                  };
                  return dicomWebClient
                    .retrieveBulkData(options)
                    .then(val => {
                      const ret = (val && val[0]) || undefined;
                      value.Value = ret;
                      return ret;
                    });
                };
              }
            });
            return naturalized;
          };

          // Async load series, store as retrieved
          function storeInstances(instances) {
            const naturalizedInstances = instances.map(addRetrieveBulkData);

            DicomMetadataStore.addInstances(naturalizedInstances, madeInClient);
          }

          function setSuccessFlag() {
            const study = DicomMetadataStore.getStudy(
              StudyInstanceUID,
              madeInClient
            );
            study.isLoaded = true;
          }

          // Google Cloud Healthcare doesn't return StudyInstanceUID, so we need to add
          // it manually here
          seriesSummaryMetadata.forEach(aSeries => {
            aSeries.StudyInstanceUID = StudyInstanceUID;
          });

          DicomMetadataStore.addSeriesMetadata(
            seriesSummaryMetadata,
            madeInClient
          );

          const numberOfSeries = seriesPromises.length;
          seriesPromises.forEach(async (seriesPromise, index) => {
            const instances = await seriesPromise;
            storeInstances(instances);
            if (index === numberOfSeries - 1) setSuccessFlag();
          });
        },
      },
    },
    store: {
      dicom: async dataset => {
        const headers = UserAuthenticationService.getAuthorizationHeader();
        if (headers) {
          dicomWebClient.headers = headers;
        }

        const meta = {
          FileMetaInformationVersion:
            dataset._meta.FileMetaInformationVersion.Value,
          MediaStorageSOPClassUID: dataset.SOPClassUID,
          MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
          TransferSyntaxUID: EXPLICIT_VR_LITTLE_ENDIAN,
          ImplementationClassUID,
          ImplementationVersionName,
        };

        const denaturalized = denaturalizeDataset(meta);
        const dicomDict = new DicomDict(denaturalized);

        dicomDict.dict = denaturalizeDataset(dataset);

        const part10Buffer = dicomDict.write();

        const options = {
          datasets: [part10Buffer],
        };

        await dicomWebClient.storeInstances(options);
      },
    },
    deleteStudyMetadataPromise,
    getImageIdsForDisplaySet(displaySet) {
      const images = displaySet.images;
      const imageIds = [];

      if (!images) {
        return imageIds;
      }

      displaySet.images.forEach(instance => {
        const NumberOfFrames = instance.NumberOfFrames;

        if (NumberOfFrames > 1) {
          for (let i = 0; i < NumberOfFrames; i++) {
            const imageId = this.getImageIdsForInstance({
              instance,
              frame: i,
            });
            imageIds.push(imageId);
          }
        } else {
          const imageId = this.getImageIdsForInstance({ instance });
          imageIds.push(imageId);
        }
      });

      return imageIds;
    },
    getImageIdsForInstance({ instance, frame }) {
      const imageIds = getImageId({
        instance,
        frame,
        config: dicomWebConfig,
      });
      return imageIds;
    },
  };

  if (supportsReject) {
    implementation.reject = dcm4cheeReject(`${baseUrl}/${wadoUrlPrefix}`);
  }

  return IWebApiDataSource.create(implementation);
}

export { createDicomWebApi };
