import { DicomMetadataStore, IWebApiDataSource, utils, classes } from '@ohif/core';
import DicomWebClientManager from './utils/DicomWebClientManager';

import {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
} from './qido.js';

import getImageId from './utils/getImageId';
import dcmjs from 'dcmjs';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from './retrieveStudyMetadata.js';
import getDirectURL from '../utils/getDirectURL';
import { fixBulkDataURI } from './utils/fixBulkDataURI';
import {
  mergedSearch,
  mergedSeriesSearch,
  retrieveMergedSeriesMetadata,
  retrieveMergedStudyMetadata,
} from './utils/mergeUtils';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-VIEWER-2.0.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const SERIES_INSTANCE_UID = '0020000E';

const metadataProvider = classes.MetadataProvider;

/**
 * Creates DicomWeb api.
 *
 * @param {Object} dicomWebConfig - dicomweb client configuration
 * @param {Object} userAuthenticationService - service object responsible for user authentication
 */
function createDicomWebApi(dicomWebConfig, userAuthenticationService) {
  let dicomWebClientManager;
  const implementation = {
    initialize: ({ params, query }) => {
      dicomWebClientManager = new DicomWebClientManager({
        params,
        query,
        configs: dicomWebConfig,
        userAuthenticationService,
      });
    },
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function (origParams) {
          const clients = dicomWebClientManager.getQidoClients();

          if (clients.length === 1) {
            const results = await qidoSearch(
              clients[0].qidoDicomWebClient,
              undefined,
              undefined,
              mapParams
            );
            return processResults(results);
          }

          const results = await mergedSearch({ clients, origParams, mapParams, qidoSearch });
          return processResults(results);
        },
        processResults: processResults.bind(),
      },
      series: {
        search: async function (studyInstanceUid) {
          const clients = dicomWebClientManager.getQidoClients();

          if (clients.length === 1) {
            const results = await seriesInStudy(clients[0].qidoDicomWebClient, studyInstanceUid);
            return processSeriesResults(results);
          }

          const results = await mergedSeriesSearch({ clients, seriesInStudy, studyInstanceUid });
          return processSeriesResults(results);
        },
      },
      instances: {
        search: (studyInstanceUid, queryParameters) => {
          const clients = dicomWebClientManager.getQidoClients();
          for (let i = 0; i < clients.length; i++) {
            qidoSearch.call(
              undefined,
              clients[i].qidoDicomWebClient,
              studyInstanceUid,
              null,
              queryParameters
            );
          }
        },
      },
    },
    retrieve: {
      /**
       * Generates a URL that can be used for direct retrieve of the bulkdata
       *
       * @param {object} params
       * @returns an absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
       *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI
       */
      directURL: params => {
        const client = dicomWebClientManager.getClient(params?.instance?.clientName);
        return getDirectURL(
          {
            wadoRoot: client.wadoRoot,
            singlepart: client.singlepart,
          },
          params
        );
      },
      bulkDataURI: async ({ StudyInstanceUID, BulkDataURI, clientName }) => {
        const options = {
          multipart: false,
          BulkDataURI,
          StudyInstanceUID,
        };
        return dicomWebClientManager
          .getQidoClient(clientName)
          .retrieveBulkData(options)
          .then(val => {
            const ret = (val && val[0]) || undefined;
            return ret;
          });
      },
      series: {
        metadata: async ({
          StudyInstanceUID,
          filters,
          sortCriteria,
          sortFunction,
          madeInClient = false,
        }) => {
          if (!StudyInstanceUID) {
            throw new Error('Unable to query for SeriesMetadata without StudyInstanceUID');
          }

          if (dicomWebClientManager.getClient().enableStudyLazyLoad) {
            return implementation._retrieveSeriesMetadataAsync(
              StudyInstanceUID,
              filters,
              sortCriteria,
              sortFunction,
              madeInClient
            );
          }

          return implementation._retrieveSeriesMetadataSync(
            StudyInstanceUID,
            filters,
            sortCriteria,
            sortFunction,
            madeInClient
          );
        },
      },
    },
    store: {
      dicom: async (dataset, request) => {
        const clientName = dataset?.clientName;
        let options;
        if (dataset instanceof ArrayBuffer) {
          options = {
            datasets: [dataset],
            request,
          };
        } else {
          const meta = {
            FileMetaInformationVersion: dataset._meta?.FileMetaInformationVersion?.Value,
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

          options = {
            datasets: [part10Buffer],
            request,
          };
        }
        await dicomWebClientManager.getWadoClient(clientName).storeInstances(options);
      },
    },

    _retrieveSeriesMetadataSync: async (
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient
    ) => {
      const enableStudyLazyLoad = false;
      const clients = dicomWebClientManager.getWadoClients();

      let naturalizedInstancesMetadata = [];
      if (clients.length === 1) {
        const data = await retrieveStudyMetadata(
          clients[0].wadoDicomWebClient,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction
        );
        naturalizedInstancesMetadata = data.map(naturalizeDataset);
      } else {
        naturalizedInstancesMetadata = await retrieveMergedSeriesMetadata({
          clients,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction,
        });
      }

      const seriesSummaryMetadata = {};
      const instancesPerSeries = {};

      naturalizedInstancesMetadata.forEach(instance => {
        if (!seriesSummaryMetadata[instance.SeriesInstanceUID]) {
          seriesSummaryMetadata[instance.SeriesInstanceUID] = {
            StudyInstanceUID: instance.StudyInstanceUID,
            StudyDescription: instance.StudyDescription,
            SeriesInstanceUID: instance.SeriesInstanceUID,
            SeriesDescription: instance.SeriesDescription,
            SeriesNumber: instance.SeriesNumber,
            SeriesTime: instance.SeriesTime,
            SOPClassUID: instance.SOPClassUID,
            ProtocolName: instance.ProtocolName,
            Modality: instance.Modality,
          };
        }

        if (!instancesPerSeries[instance.SeriesInstanceUID]) {
          instancesPerSeries[instance.SeriesInstanceUID] = [];
        }

        const imageId = implementation.getImageIdsForInstance({
          instance,
        });

        instance.imageId = imageId;
        instance.wadoRoot = dicomWebConfig.wadoRoot;
        instance.wadoUri = dicomWebConfig.wadoUri;

        metadataProvider.addImageIdToUIDs(imageId, {
          StudyInstanceUID,
          SeriesInstanceUID: instance.SeriesInstanceUID,
          SOPInstanceUID: instance.SOPInstanceUID,
        });

        instancesPerSeries[instance.SeriesInstanceUID].push(instance);
      });

      // grab all the series metadata
      const seriesMetadata = Object.values(seriesSummaryMetadata);
      DicomMetadataStore.addSeriesMetadata(seriesMetadata, madeInClient);

      Object.keys(instancesPerSeries).forEach(seriesInstanceUID =>
        DicomMetadataStore.addInstances(instancesPerSeries[seriesInstanceUID], madeInClient)
      );
    },

    _retrieveSeriesMetadataAsync: async (
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient = false
    ) => {
      const enableStudyLazyLoad = true;
      const clients = dicomWebClientManager.getWadoClients();

      let seriesSummaryMetadata = [];
      let seriesPromises = [];
      let seriesClientsMapping = {};
      if (clients.length === 1) {
        const { preLoadData, promises } = await retrieveStudyMetadata(
          clients[0].wadoDicomWebClient,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction
        );
        seriesSummaryMetadata = preLoadData;
        seriesPromises = promises;
      } else {
        const {
          preLoadData,
          promises,
          seriesClientsMapping: _seriesClientsMapping,
        } = await retrieveMergedStudyMetadata({
          clients,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction,
        });
        seriesSummaryMetadata = preLoadData;
        seriesPromises = promises;
        seriesClientsMapping = _seriesClientsMapping;
      }

      /**
       * naturalizes the dataset, and adds a retrieve bulk data method
       * to any values containing BulkDataURI.
       * @param {*} instance
       * @returns naturalized dataset, with retrieveBulkData methods
       */
      const addRetrieveBulkData = instance => {
        const clientName = instance?.clientName;
        const naturalized = naturalizeDataset(instance);
        const client = dicomWebClientManager.getClient(clientName);

        // if we know the server doesn't use bulkDataURI, then don't
        if (!client.bulkDataURI?.enabled) {
          return naturalized;
        }

        Object.keys(naturalized).forEach(key => {
          const value = naturalized[key];

          // The value.Value will be set with the bulkdata read value
          // in which case it isn't necessary to re-read this.
          if (value && value.BulkDataURI && !value.Value) {
            // Provide a method to fetch bulkdata
            value.retrieveBulkData = () => {
              // handle the scenarios where bulkDataURI is relative path
              fixBulkDataURI(value, naturalized, client);

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
              // Todo: this needs to be from wado dicom web client
              return dicomWebClientManager
                .getQidoClient()
                .retrieveBulkData(options)
                .then(val => {
                  // There are DICOM PDF cases where the first ArrayBuffer in the array is
                  // the bulk data and DICOM video cases where the second ArrayBuffer is
                  // the bulk data. Here we play it safe and do a find.
                  const ret =
                    (val instanceof Array && val.find(arrayBuffer => arrayBuffer?.byteLength)) ||
                    undefined;
                  value.Value = ret;
                  return ret;
                });
            };
          }
        });
        return naturalized;
      };

      // Async load series, store as retrieved
      function storeInstances(instances, clientName) {
        const naturalizedInstances = instances.map(addRetrieveBulkData);

        // Adding instanceMetadata to OHIF MetadataProvider
        const client = dicomWebClientManager.getClient(clientName);
        const wadoRoot = client.wadoRoot;
        const wadoUri = client.wadoUri;
        naturalizedInstances.forEach(instance => {
          // attach client specific information in each instance
          instance.wadoRoot = wadoRoot;
          instance.wadoUri = wadoUri;
          instance.clientName = clientName;

          const imageId = implementation.getImageIdsForInstance({
            instance,
          });

          // Adding imageId to each instance
          // Todo: This is not the best way I can think of to let external
          // metadata handlers know about the imageId that is stored in the store
          instance.imageId = imageId;

          // Adding UIDs to metadataProvider
          // Note: storing imageURI in metadataProvider since stack viewports
          // will use the same imageURI
          metadataProvider.addImageIdToUIDs(imageId, {
            StudyInstanceUID,
            SeriesInstanceUID: instance.SeriesInstanceUID,
            SOPInstanceUID: instance.SOPInstanceUID,
          });
        });

        DicomMetadataStore.addInstances(naturalizedInstances, madeInClient);
      }

      function setSuccessFlag() {
        const study = DicomMetadataStore.getStudy(StudyInstanceUID);
        if (!study) {
          return;
        }
        study.isLoaded = true;
      }

      // Google Cloud Healthcare doesn't return StudyInstanceUID, so we need to add
      // it manually here
      seriesSummaryMetadata.forEach(aSeries => {
        aSeries.StudyInstanceUID = StudyInstanceUID;
      });

      DicomMetadataStore.addSeriesMetadata(seriesSummaryMetadata, madeInClient);

      const seriesDeliveredPromises = seriesPromises.map(promise =>
        promise.then(instances => {
          const clientName =
            clients.length === 1
              ? clients[0].name
              : seriesClientsMapping[instances[0][SERIES_INSTANCE_UID].Value[0]];
          storeInstances(instances, clientName);
        })
      );
      await Promise.all(seriesDeliveredPromises);
      setSuccessFlag();
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
          for (let frame = 1; frame <= NumberOfFrames; frame++) {
            const imageId = this.getImageIdsForInstance({
              instance,
              frame,
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
    getImageIdsForInstance({ instance, frame = undefined }) {
      const imageIds = getImageId({
        instance,
        frame,
        config: dicomWebClientManager.getClient(instance?.clientName),
      });
      return imageIds;
    },
    getConfig() {
      return dicomWebClientManager?.getConfig();
    },
    getStudyInstanceUIDs({ params, query }) {
      const { StudyInstanceUIDs: paramsStudyInstanceUIDs } = params;
      const queryStudyInstanceUIDs = utils.splitComma(query.getAll('StudyInstanceUIDs'));

      const StudyInstanceUIDs =
        (queryStudyInstanceUIDs.length && queryStudyInstanceUIDs) || paramsStudyInstanceUIDs;
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs];

      return StudyInstanceUIDsAsArray;
    },
    /**
     * returns a boolean indicating if a client has reject capabilities
     * @param {*} clientName
     * @returns {boolean}
     */
    clientCanReject: clientName => {
      return dicomWebClientManager.clientCanReject(clientName);
    },
    /**
     * implements the series rejection. Only dcm4chee series rejection is
     * supported for now
     */
    reject: {
      series: (studyInstanceUID, seriesInstanceUID, clientName) => {
        const rejectObject = dicomWebClientManager.getClientReject(clientName);
        if (rejectObject) {
          return rejectObject.series(studyInstanceUID, seriesInstanceUID);
        }
      },
    },
  };

  return IWebApiDataSource.create(implementation);
}

export { createDicomWebApi };
