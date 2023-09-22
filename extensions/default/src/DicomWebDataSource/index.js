import { DicomMetadataStore, IWebApiDataSource, utils, classes } from '@ohif/core';
import ClientManager from './utils/clientManager';

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

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-VIEWER-2.0.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const STUDY_INSTANCE_UID = '0020000D';
const SERIES_INSTANCE_UID = '0020000E';
const NUMBER_STUDY_SERIES = '00201206';
const NUMBER_STUDY_INSTANCES = '00201208';

const metadataProvider = classes.MetadataProvider;

/**
 *
 * @param {Object} dicomWebConfig - dicomweb client configuration
 * @param {Object} userAuthenticationService - service object responsible for user authentication
 */
function createDicomWebApi(dicomWebConfig, userAuthenticationService) {
  let clientManager;
  const implementation = {
    initialize: ({ params, query }) => {
      clientManager = new ClientManager({
        params,
        query,
        dicomWebConfig,
        userAuthenticationService,
      });
      // here clientManager returns, if any, the reject function of the first
      // client that supports it. This server should be the first main server
      implementation.clientCanReject = clientManager.clientCanReject();
    },
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function (origParams) {
          clientManager.setQidoHeaders();
          let results = [];
          const studyInstanceUIDs = {};
          // concatenate series metadata from all servers
          const clients = clientManager.getClients();
          for (let i = 0; i < clients.length; i++) {
            const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
              mapParams(origParams, {
                supportsFuzzyMatching: clients[i].supportsFuzzyMatching,
                supportsWildcard: clients[i].supportsWildcard,
              }) || {};
            let clientResults;
            try {
              clientResults = await qidoSearch(
                clients[i].qidoDicomWebClient,
                undefined,
                undefined,
                mappedParams
              );
            } catch {
              clientResults = [];
            }
            for (let j = 0; j < clientResults.length; j++) {
              const studyInstanceUID = clientResults[j][STUDY_INSTANCE_UID].Value[0];
              if (!(studyInstanceUID in studyInstanceUIDs)) {
                studyInstanceUIDs[studyInstanceUID] = clientResults[j];
                results.push(clientResults[j]);
              } else {
                // updates number of series in study
                if (
                  studyInstanceUIDs[studyInstanceUID][NUMBER_STUDY_SERIES] &&
                  clientResults[j][NUMBER_STUDY_SERIES]
                ) {
                  studyInstanceUIDs[studyInstanceUID][NUMBER_STUDY_SERIES].Value[0] =
                    studyInstanceUIDs[studyInstanceUID][NUMBER_STUDY_SERIES].Value[0] +
                    clientResults[j][NUMBER_STUDY_SERIES].Value[0];
                }

                // updates number of instances in study
                if (
                  studyInstanceUIDs[studyInstanceUID][NUMBER_STUDY_INSTANCES] &&
                  clientResults[j][NUMBER_STUDY_INSTANCES]
                ) {
                  studyInstanceUIDs[studyInstanceUID][NUMBER_STUDY_INSTANCES].Value[0] =
                    studyInstanceUIDs[studyInstanceUID][NUMBER_STUDY_INSTANCES].Value[0] +
                    clientResults[j][NUMBER_STUDY_INSTANCES].Value[0];
                }
              }
            }
          }
          return processResults(results);
        },
        processResults: processResults.bind(),
      },
      series: {
        search: async function (studyInstanceUid) {
          clientManager.setQidoHeaders();
          let results = [];
          const seriesInstanceUIDs = [];
          // concatenate series metadata from all servers
          const clients = clientManager.getClients();
          for (let i = 0; i < clients.length; i++) {
            let clientResults;
            try {
              clientResults = await seriesInStudy(clients[i].qidoDicomWebClient, studyInstanceUid);
            } catch {
              clientResults = [];
            }
            for (let j = 0; j < clientResults.length; j++) {
              const seriesInstanceUID = clientResults[j]['0020000E'].Value[0];
              if (!seriesInstanceUIDs.includes(seriesInstanceUID)) {
                seriesInstanceUIDs.push(seriesInstanceUID);
                results.push(clientResults[j]);
              }
            }
          }
          return processSeriesResults(results);
        },
      },
      instances: {
        search: (studyInstanceUid, queryParameters) => {
          clientManager.setQidoHeaders();
          // concatenate instance metadata from all servers
          const clients = clientManager.getClients();
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
        const clientName = params?.instance?.clientName;
        return getDirectURL(
          {
            wadoRoot: clientManager.getClient(clientName).wadoRoot,
            singlepart: clientManager.getClient(clientName).singlepart,
          },
          params
        );
      },
      bulkDataURI: async ({ StudyInstanceUID, BulkDataURI, clientName }) => {
        clientManager.setQidoHeaders();
        const options = {
          multipart: false,
          BulkDataURI,
          StudyInstanceUID,
        };
        return clientManager
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

          if (clientManager.getClient().enableStudyLazyLoad) {
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
        clientManager.setAuthorizationHeadersForWADO();
        const clientName = dataset?.clientName;
        if (dataset instanceof ArrayBuffer) {
          const options = {
            datasets: [dataset],
            request,
          };
          await clientManager.getWadoClient(clientName).storeInstances(options);
        } else {
          const meta = {
            FileMetaInformationVersion: dataset._meta.FileMetaInformationVersion.Value,
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
            request,
          };

          await clientManager.getWadoClient(clientName).storeInstances(options);
        }
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
      clientManager.setWadoHeaders();

      const naturalizedInstancesMetadata = [];
      const seriesConcatenated = [];
      // search and retrieve in all servers
      const clients = clientManager.getClients();
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
          const converted = naturalizeDataset(item);
          if (
            !seriesConcatenated.includes(converted.SeriesInstanceUID) &&
            !newSeries.includes(converted.SeriesInstanceUID)
          ) {
            newSeries.push(converted.SeriesInstanceUID);
          }
          converted.clientName = clients[i].name;
          return converted;
        });

        // adding only instances belonging to new series
        for (let i = 0; i < clientNaturalizedInstancesMetadata.length; i++) {
          const item = clientNaturalizedInstancesMetadata[i];
          if (newSeries.includes(item.SeriesInstanceUID)) {
            naturalizedInstancesMetadata.push(item);
          }
        }
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
      clientManager.setWadoHeaders();
      // Get Series
      const clients = clientManager.getClients();
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

        // create a mapping between SeriesInstanceUID <--> clientName
        for (let j = 0; j < clientSeriesSummaryMetadata.length; j++) {
          if (!seriesClientsMapping[clientSeriesSummaryMetadata[j].SeriesInstanceUID]) {
            seriesClientsMapping[clientSeriesSummaryMetadata[j].SeriesInstanceUID] =
              clients[i].name;

            seriesSummaryMetadata.push(clientSeriesSummaryMetadata[j]);
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

        // if we know the server doesn't use bulkDataURI, then don't
        if (!clientManager.getClient(clientName).bulkDataURI?.enabled) {
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
              fixBulkDataURI(value, naturalized, clientManager.getClient(clientName));

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
              return clientManager
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
        naturalizedInstances.forEach((instance, index) => {
          // attach client specific information in each instance
          instance.wadoRoot = clientManager.getClient(clientName).wadoRoot;
          instance.wadoUri = clientManager.getClient(clientName).wadoUri;
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
        config: clientManager.getClient(instance?.clientName),
      });
      return imageIds;
    },
    getConfig() {
      return clientManager?.getClient();
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
  };

  return IWebApiDataSource.create(implementation);
}

export { createDicomWebApi };
