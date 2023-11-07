import { DicomMetadataStore, IWebApiDataSource, utils, classes } from '@ohif/core';
import DicomWebClientManager from './utils/clientManager';

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
import mergeResults from './utils/mergeResults';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-VIEWER-2.0.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const STUDY_INSTANCE_UID = '0020000D';
const SERIES_INSTANCE_UID = '0020000E';

const metadataProvider = classes.MetadataProvider;

/**
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
        dicomWebConfigs: dicomWebConfig,
        userAuthenticationService,
      });
    },
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function (origParams) {
          const clients = dicomWebClientManager.getQidoClients();
          // concatenate series metadata from all servers
          const clientResultsPromises = clients.map(client => {
            const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
              mapParams(origParams, {
                supportsFuzzyMatching: client.supportsFuzzyMatching,
                supportsWildcard: client.supportsWildcard,
              }) || {};
            let clientResults;
            try {
              clientResults = qidoSearch(
                client.qidoDicomWebClient,
                undefined,
                undefined,
                mappedParams
              );
            } catch {
              clientResults = [];
            }
            return clientResults;
          });
          const settledResults = await Promise.allSettled(clientResultsPromises);

          const mergedResults = mergeResults(settledResults, STUDY_INSTANCE_UID);
          return processResults(mergedResults);
        },
        processResults: processResults.bind(),
      },
      series: {
        search: async function (studyInstanceUid) {
          const clients = dicomWebClientManager.getQidoClients();
          // concatenate series metadata from all servers
          const clientResultsPromises = clients.map(client => {
            let clientResults;
            try {
              clientResults = seriesInStudy(client.qidoDicomWebClient, studyInstanceUid);
            } catch {
              clientResults = [];
            }
            return clientResults;
          });
          const settledResults = await Promise.allSettled(clientResultsPromises);
          const results = mergeResults(settledResults, SERIES_INSTANCE_UID);
          return processSeriesResults(results);
        },
      },
      instances: {
        search: (studyInstanceUid, queryParameters) => {
          const clients = dicomWebClientManager.getQidoClients();
          // concatenate instance metadata from all servers
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
        } = {}) => {
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

      const naturalizedInstancesMetadata = [];
      const seriesConcatenated = [];
      // search and retrieve in all servers
      for (let i = 0; i < clients.length; i++) {
        const data = await retrieveStudyMetadata(
          clients[i].wadoDicomWebClient,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction
        );
        const newSeries = [];
        // attach the client Name in each metadata
        const clientNaturalizedInstancesMetadata = data.map(item => {
          const naturalizedData = naturalizeDataset(item);
          if (
            !seriesConcatenated.includes(naturalizedData.SeriesInstanceUID) &&
            !newSeries.includes(naturalizedData.SeriesInstanceUID)
          ) {
            newSeries.push(naturalizedData.SeriesInstanceUID);
          }
          naturalizedData.clientName = clients[i].name;
          return naturalizedData;
        });

        // adding only instances belonging to new series
        clientNaturalizedInstancesMetadata.forEach(item => {
          if (newSeries.includes(item.SeriesInstanceUID)) {
            naturalizedInstancesMetadata.push(item);
          }
        });
        // adding new series
        newSeries.forEach(seriesUID => seriesConcatenated.push(seriesUID));
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
      // Get Series
      let seriesSummaryMetadata = [];
      let seriesPromises = [];
      const seriesClientsMapping = {};
      for (let i = 0; i < clients.length; i++) {
        let clientSeriesSummaryMetadata, clientSeriesPromises;
        try {
          const { preLoadData, promises } = await retrieveStudyMetadata(
            clients[i].wadoDicomWebClient,
            StudyInstanceUID,
            enableStudyLazyLoad,
            filters,
            sortCriteria,
            sortFunction
          );
          clientSeriesSummaryMetadata = preLoadData;
          clientSeriesPromises = promises;
        } catch {
          clientSeriesSummaryMetadata = [];
          clientSeriesPromises = [];
        }

        // create a mapping between SeriesInstanceUID <--> clientName, for two reasons:
        // 1 - remove duplicates in series metadata
        // 2 - associate each instance in a series with the name of the client it was retrieved
        for (const [j, seriesSummary] of clientSeriesSummaryMetadata.entries()) {
          const seriesUID = seriesSummary.SeriesInstanceUID;

          if (!seriesClientsMapping[seriesUID]) {
            seriesClientsMapping[seriesUID] = clients[i].name;
            seriesSummaryMetadata.push(seriesSummary);
            seriesPromises.push(clientSeriesPromises[j]);
          }
        }
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
        naturalizedInstances.forEach((instance, index) => {
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
        const study = DicomMetadataStore.getStudy(StudyInstanceUID, madeInClient);
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
          const clientName = seriesClientsMapping[instances[0][SERIES_INSTANCE_UID].Value[0]];
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
    getImageIdsForInstance({ instance, frame }) {
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
