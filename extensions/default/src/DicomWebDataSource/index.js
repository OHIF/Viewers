import { api } from 'dicomweb-client';
import {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
} from './qido.js';
import dcm4cheeReject from './dcm4cheeReject';
import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler } from '@ohif/core';

import getImageId from './utils/getImageId';
import dcmjs from 'dcmjs';
import {
  retrieveStudyMetadata,
  deleteStudyMetadataPromise,
} from './retrieveStudyMetadata.js';
import StaticWadoClient from './utils/StaticWadoClient.js';

import axios from "axios";

const nlApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.includes("http://localhost") : false,
});

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
 * @param {string} wadoUriRoot - Legacy? (potentially unused/replaced)
 * @param {string} qidoRoot - Base URL to use for QIDO requests
 * @param {string} wadoRoot - Base URL to use for WADO requests
 * @param {boolean} qidoSupportsIncludeField - Whether QIDO supports the "Include" option to request additional fields in response
 * @param {string} imageRengering - wadors | ? (unsure of where/how this is used)
 * @param {string} thumbnailRendering - wadors | ? (unsure of where/how this is used)
 * @param {bool} supportsReject - Whether the server supports reject calls (i.e. DCM4CHEE)
 * @param {bool} lazyLoadStudy - "enableStudyLazyLoad"; Request series meta async instead of blocking
 */
function createDicomWebApi(dicomWebConfig, UserAuthenticationService) {
  const {
    qidoRoot,
    wadoRoot,
    enableStudyLazyLoad,
    supportsFuzzyMatching,
    supportsWildcard,
    supportsReject,
    staticWado,
  } = dicomWebConfig;

  const qidoConfig = {
    url: qidoRoot,
    staticWado,
    headers: UserAuthenticationService.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };

  const wadoConfig = {
    url: wadoRoot,
    headers: UserAuthenticationService.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };

  // TODO -> Two clients sucks, but its better than 1000.
  // TODO -> We'll need to merge auth later.
  const qidoDicomWebClient = staticWado ? new StaticWadoClient(qidoConfig) : new api.DICOMwebClient(wadoConfig);
  const wadoDicomWebClient = new api.DICOMwebClient(wadoConfig);

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
        search: async function (origParams) {

          // Sometimes Ohif does Fuzzy searching which is a dicom standard
          // GCP supports it. Fuzzy searching is searching the patient name using the
          // fuzzy method. Fo us we extract the patient name and filter studies by that
          // UID.
          const { patientId, studyInstanceUid } = origParams;
          let queryParams = ""
          if(patientId) {
            queryParams = { patient_id: patientId }
          } else {
            queryParams = { uid : studyInstanceUid }
          }
          const studyResponse = await nlApi.get("/api/studies/", { params: queryParams });

          return studyResponse.data.results;
        },
        processResults: processResults.bind(),
      },
      series: {
        // mapParams: mapParams.bind(),
        search: async function (studyInstanceUid) {
          const headers = UserAuthenticationService.getAuthorizationHeader();
          if (headers) {
            qidoDicomWebClient.headers = headers;
          }

          const results = await seriesInStudy(
            qidoDicomWebClient,
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
            qidoDicomWebClient.headers = headers;
          }

          qidoSearch.call(
            undefined,
            qidoDicomWebClient,
            studyInstanceUid,
            null,
            queryParameters
          );
        },
      },
    },
    retrieve: {
      series: {
        // TODO: change queryParams to `StudyInstanceUID` for now?
        // Conduct query, return a promise like others
        // Await this call and add to DicomMetadataStore after receiving result
        metadata: (queryParams, callback) => {
          const headers = UserAuthenticationService.getAuthorizationHeader();
          if (headers) {
            wadoDicomWebClient.headers = headers;
          }

          let { StudyInstanceUIDs } = urlUtil.parse(queryParams, true);

          StudyInstanceUIDs = urlUtil.paramString.parseParam(StudyInstanceUIDs);

          if (!StudyInstanceUIDs) {
            throw new Error(
              'Incomplete queryParams, missing StudyInstanceUIDs'
            );
          }

          const storeInstances = instances => {
            const naturalizedInstances = instances.map(naturalizeDataset);

            DicomMetadataStore.addInstances(naturalizedInstances);
            callback(naturalizedInstances);
          };
          const studyPromises = StudyInstanceUIDs.map(StudyInstanceUID =>
            retrieveStudyMetadata(
              wadoDicomWebClient,
              StudyInstanceUID,
              enableStudyLazyLoad
            )
          );

          studyPromises.forEach(studyPromise => {
            studyPromise.then(data => {
              const { seriesPromises } = data;
              seriesPromises.forEach(seriesPromise => {
                seriesPromise.then(instances => {
                  storeInstances(instances);
                });
              });
            });
          });
        },
      },
    },
    store: {
      dicom: async dataset => {
        const headers = UserAuthenticationService.getAuthorizationHeader();
        if (headers) {
          wadoDicomWebClient.headers = headers;
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

        await wadoDicomWebClient.storeInstances(options);
      },
    },
    // TODO: Rename this it makes no sense at all
    retrieveSeriesMetadata: async ({
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient = false,
    } = {}) => {
      const headers = UserAuthenticationService.getAuthorizationHeader();
      if (headers) {
        wadoDicomWebClient.headers = headers;
      }

      if (!StudyInstanceUID) {
        throw new Error(
          'Unable to query for SeriesMetadata without StudyInstanceUID'
        );
      }
      const studyResponse = await nlApi.get("/api/studies/", {
        params: {
          uid: StudyInstanceUID
        }}
      );
      if(studyResponse.status !== 200){
        throw new Error(
          'Unable to fetch study metadata'
        );
      }

      const patientResponse = await nlApi.get("/api/patients/", {
        params: {
          id: studyResponse.data.results[0].patient_id
        }}
      );
      if(patientResponse.status !== 200){
        throw new Error(
          'Unable to fetch patient metadata'
        );
      }

      const seriesResponse = await nlApi.get("/api/series/", {
        params: {
          study_id: studyResponse.data.results[0].id
        }}
      );
      if(seriesResponse.status !== 200){
        throw new Error(
          'Unable to fetch series metadata'
        );
      }

      const seriesSummaryMetadata = seriesResponse.data.results

      function setSuccessFlag() {
        const study = DicomMetadataStore.getStudy(
          StudyInstanceUID,
          madeInClient
        );
        study.isLoaded = true;
        DicomMetadataStore.studyLoaded(study);
      }

      DicomMetadataStore.addSeriesMetadata(seriesSummaryMetadata, madeInClient);

      const numberOfSeries = seriesSummaryMetadata.length;
      seriesSummaryMetadata.forEach(async (series, index) => {
        const instancesResponse = await nlApi.get("/api/instances/", {
          params: {
            series_id: series.id
          }}
        );
        const instances = instancesResponse.data.results.map(instance => ({...instance, ...series, ...patientResponse.data.results[0], ...studyResponse.data.results[0], ...instance.overlay_data }))
        if(instancesResponse.status !== 200){
          throw new Error(
            'Unable to fetch instance metadata'
          );
        }
        DicomMetadataStore.addInstances(instances, madeInClient);
        if (index === numberOfSeries - 1) setSuccessFlag();
      });
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
    implementation.reject = dcm4cheeReject(wadoRoot);
  }

  return IWebApiDataSource.create(implementation);
}

export { createDicomWebApi };
