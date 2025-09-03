import { api } from 'dicomweb-client';
import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler, classes } from '@ohif/core';

import {
  mapParams,
  qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
  listSeries,
  listSeriesInstances,
  retrieveStudyMetadata,
  deleteStudyMetadataPromise,
  retrieveInstanceMetadata,
  generateInstanceMetaData,
  generateStudyMetaData,
  dicomWebToDicomStructure,
  dicomWebToRawDicomInstances,
  getImageIdsForInstance,
  addRetrieveBulkData,
  StaticWadoClient,
  getDirectURL
} from '../utils';
import dcm4cheeReject from './dcm4cheeReject.js';

import dcmjs from 'dcmjs';
import {HeadersInterface} from '@ohif/core/src/types/RequestHeaders';
import { DicomWebConfig, BulkDataURIConfig } from './utils/dicomWebConfig';
import { RetrieveStudyMetadataInterface } from './utils/Types';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-3.11.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

const metadataProvider = classes.MetadataProvider;

/**
 * Creates a DICOM Web API based on the provided configuration.
 *
 * @param dicomWebConfig - Configuration for the DICOM Web API
 * @returns DICOM Web API object
 */
function createDicomWebMinimalApi(dicomWebConfig: DicomWebConfig, servicesManager) {
  const { userAuthenticationService } = servicesManager.services;
  let dicomWebConfigCopy,
    qidoConfig,
    wadoConfig,
    qidoDicomWebClient,
    wadoDicomWebClient,
    getAuthorizationHeader,
    generateWadoHeader;
  // Default to enabling bulk data retrieves, with no other customization as
  // this is part of hte base standard.
  dicomWebConfig.bulkDataURI ||= { enabled: true };

  const implementation = {
    initialize: ({ params, query }) => {
      if (dicomWebConfig.onConfiguration && typeof dicomWebConfig.onConfiguration === 'function') {
        dicomWebConfig = dicomWebConfig.onConfiguration(dicomWebConfig, {
          params,
          query,
        });
      }

      dicomWebConfigCopy = JSON.parse(JSON.stringify(dicomWebConfig));

      getAuthorizationHeader = () => {
        const xhrRequestHeaders: HeadersInterface = {};
        const authHeaders = userAuthenticationService.getAuthorizationHeader();
        if (authHeaders && authHeaders.Authorization) {
          xhrRequestHeaders.Authorization = authHeaders.Authorization;
        }
        return xhrRequestHeaders;
      };

      generateWadoHeader = (skipAccept: boolean = false): HeadersInterface => {
        const authorizationHeader = getAuthorizationHeader();
        if (!skipAccept) {
          //Generate accept header depending on config params
          const formattedAcceptHeader = utils.generateAcceptHeader(
            dicomWebConfig.acceptHeader,
            dicomWebConfig.requestTransferSyntaxUID,
            dicomWebConfig.omitQuotationForMultipartRequest
          );
          return {
            ...authorizationHeader,
            Accept: formattedAcceptHeader,
          };
        } else {
          return {
            ...authorizationHeader
          };
        }
      };

      qidoConfig = {
        url: dicomWebConfig.qidoRoot,
        staticWado: dicomWebConfig.staticWado,
        singlepart: dicomWebConfig.singlepart,
        headers: userAuthenticationService.getAuthorizationHeader(),
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        supportsFuzzyMatching: dicomWebConfig.supportsFuzzyMatching,
      };

      wadoConfig = {
        url: dicomWebConfig.wadoRoot,
        staticWado: dicomWebConfig.staticWado,
        singlepart: dicomWebConfig.singlepart,
        headers: userAuthenticationService.getAuthorizationHeader(),
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        supportsFuzzyMatching: dicomWebConfig.supportsFuzzyMatching,
      };

      // TODO -> Two clients sucks, but its better than 1000.
      // TODO -> We'll need to merge auth later.
      qidoDicomWebClient = dicomWebConfig.staticWado
        ? new StaticWadoClient(qidoConfig)
        : new api.DICOMwebClient(qidoConfig);

      wadoDicomWebClient = dicomWebConfig.staticWado
        ? new StaticWadoClient(wadoConfig)
        : new api.DICOMwebClient(wadoConfig);
    },
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function (origParams) {
          qidoDicomWebClient.headers = getAuthorizationHeader();
          const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
            mapParams(origParams, {
              supportsFuzzyMatching: dicomWebConfig.supportsFuzzyMatching,
              supportsWildcard: dicomWebConfig.supportsWildcard,
            }) || {};

          const results = await qidoSearch(qidoDicomWebClient, undefined, undefined, mappedParams);

          return processResults(results);
        },
        processResults: processResults.bind(),
      },
      series: {
        // mapParams: mapParams.bind(),
        search: async function (studyInstanceUid) {
          qidoDicomWebClient.headers = getAuthorizationHeader();
          const results = await seriesInStudy(qidoDicomWebClient, studyInstanceUid);

          return processSeriesResults(results);
        },
        // processResults: processResults.bind(),
        list: async (studyInstanceUid: string, filters) => {
          if (!studyInstanceUid) {
            throw new Error('Unable to query for Series List without studyInstanceUid');
          }
          return listSeries(qidoDicomWebClient, studyInstanceUid, filters)
        },
      },
      instances: {
        search: (studyInstanceUid, queryParameters) => {
          qidoDicomWebClient.headers = getAuthorizationHeader();
          return qidoSearch.call(
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
      /**
       * Generates a URL that can be used for direct retrieve of the bulkdata
       *
       * @param {object} params
       * @param {string} params.tag is the tag name of the URL to retrieve
       * @param {object} params.instance is the instance object that the tag is in
       * @param {string} params.defaultType is the mime type of the response
       * @param {string} params.singlepart is the type of the part to retrieve
       * @returns an absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
       *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI
       */

      getGetThumbnailSrc: function (instance, imageId) {
        if (dicomWebConfig.thumbnailRendering === 'wadors') {
          return function getThumbnailSrc(options) {
            if (!imageId) {
              return null;
            }
            if (!options?.getImageSrc) {
              return null;
            }
            return options.getImageSrc(imageId);
          };
        }
        if (dicomWebConfig.thumbnailRendering === 'thumbnailDirect') {
          return function getThumbnailSrc() {
            return this.directURL({
              instance: instance,
              defaultPath: '/thumbnail',
              defaultType: 'image/jpeg',
              singlepart: true,
              tag: 'Absent',
            });
          }.bind(this);
        }

        if (dicomWebConfig.thumbnailRendering === 'thumbnail') {
          return async function getThumbnailSrc() {
            const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
            const bulkDataURI = `${dicomWebConfig.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/thumbnail?accept=image/jpeg`;
            return URL.createObjectURL(
              new Blob(
                [
                  await this.bulkDataURI({
                    BulkDataURI: bulkDataURI.replace('wadors:', ''),
                    defaultType: 'image/jpeg',
                    mediaTypes: ['image/jpeg'],
                    thumbnail: true,
                  }),
                ],
                { type: 'image/jpeg' }
              )
            );
          }.bind(this);
        }
        if (dicomWebConfig.thumbnailRendering === 'rendered') {
          return async function getThumbnailSrc() {
            const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
            const bulkDataURI = `${dicomWebConfig.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/rendered?accept=image/jpeg`;
            return URL.createObjectURL(
              new Blob(
                [
                  await this.bulkDataURI({
                    BulkDataURI: bulkDataURI.replace('wadors:', ''),
                    defaultType: 'image/jpeg',
                    mediaTypes: ['image/jpeg'],
                    thumbnail: true,
                  }),
                ],
                { type: 'image/jpeg' }
              )
            );
          }.bind(this);
        }
      },

      directURL: params => {
        return getDirectURL(
          {
            wadoRoot: dicomWebConfig.wadoRoot,
            singlepart: dicomWebConfig.singlepart,
          },
          params
        );
      },
      /**
       * Provide direct access to the dicom web client for certain use cases
       * where the dicom web client is used by an external library such as the
       * microscopy viewer.
       * Note this instance only needs to support the wado queries, and may not
       * support any QIDO or STOW operations.
       */
      getWadoDicomWebClient: () => wadoDicomWebClient,

      bulkDataURI: async ({ StudyInstanceUID, BulkDataURI }) => {
        qidoDicomWebClient.headers = getAuthorizationHeader();
        const options = {
          multipart: false,
          BulkDataURI,
          StudyInstanceUID,
        };
        return qidoDicomWebClient.retrieveBulkData(options).then(val => {
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
          returnPromises = false,
        } = {}) => {
          if (!StudyInstanceUID) {
            throw new Error('Unable to query for SeriesMetadata without StudyInstanceUID');
          }

          if (dicomWebConfig.enableStudyLazyLoad) {
            return implementation._retrieveSeriesMetadataAsync(
              StudyInstanceUID,
              filters,
              sortCriteria,
              sortFunction,
              madeInClient,
              returnPromises
            );
          }

          return implementation._retrieveSeriesMetadataOptimizedSync(
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
      dicom: async (dataset, request, dicomDict) => {
        wadoDicomWebClient.headers = getAuthorizationHeader();
        if (dataset instanceof ArrayBuffer) {
          const options = {
            datasets: [dataset],
            request,
          };
          await wadoDicomWebClient.storeInstances(options);
        } else {
          let effectiveDicomDict = dicomDict;

          if (!dicomDict) {
            const meta = {
              FileMetaInformationVersion: dataset._meta?.FileMetaInformationVersion?.Value,
              MediaStorageSOPClassUID: dataset.SOPClassUID,
              MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
              TransferSyntaxUID: EXPLICIT_VR_LITTLE_ENDIAN,
              ImplementationClassUID,
              ImplementationVersionName,
            };

            const denaturalized = denaturalizeDataset(meta);
            const defaultDicomDict = new DicomDict(denaturalized);
            defaultDicomDict.dict = denaturalizeDataset(dataset);

            effectiveDicomDict = defaultDicomDict;
          }

          const part10Buffer = effectiveDicomDict.write();

          const options = {
            datasets: [part10Buffer],
            request,
          };

          await wadoDicomWebClient.storeInstances(options);
        }
      },
    },

    _retrieveSeriesMetadataOptimizedSync: async (
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient
    ) => {
      const enableStudyLazyLoad = false;

      // Discover list of series in study
      const seriesList = await listSeries(
        qidoDicomWebClient,
        StudyInstanceUID,
        filters
      )

      // Discover list of instances in each series.
      // We should have an array of arrays by now containing the raw QIDO metadata.
      const instanceMetaList = await Promise.allSettled(
        seriesList.map((series) => {
          return listSeriesInstances(
            qidoDicomWebClient,
            StudyInstanceUID,
            series.seriesInstanceUID
          )
        })
      );

      // For each series, retrieve the first and last instance metadata from the WADO interface.
      // Unfortunately, we have to do this because the QIDO results lack the IPP and other information
      // needed by the viewer to generate a hanging protocol.
      let instances = await Promise.allSettled(
        instanceMetaList.map( (instances) => {
          const items = instances.value;
          return Promise.allSettled(
            [
              retrieveInstanceMetadata(
                wadoDicomWebClient,
                StudyInstanceUID,
                enableStudyLazyLoad,
                items[0],
                sortCriteria,
                sortFunction,
                dicomWebConfig
              ),
              retrieveInstanceMetadata(
                wadoDicomWebClient,
                StudyInstanceUID,
                enableStudyLazyLoad,
                items[items.length - 1],
                sortCriteria,
                sortFunction,
                dicomWebConfig
              ),
            ]
          );
        })
      );

      // Below, we want to grab the raw instance metadata list and generate a study structure such that
      // we have a study global metadata header and a list of series. The list of series contains a list
      // of instances per series. All of these instances have to be Proxy objects because of how
      // dcmjs naturalizes the dataset. Also. note that since we only retrieved 2 slices worth of
      // metadata per series, we have to "reconstruct" the other slices so the hanging protocol's requirements
      // are satisfied! We do this by using the first slice as reference and then patch the IPP information.
      const rawInstances = dicomWebToRawDicomInstances(instances);
      const naturalizedInstancesMetadata= generateInstanceMetaData(instanceMetaList, rawInstances);
      const { seriesSummaryMetadata, instancesPerSeries } = generateStudyMetaData(
        naturalizedInstancesMetadata,
        dicomWebConfig
      );

      // Now, register the study/images with tha metadata provider.
      instancesPerSeries.forEach(instances => {
        instances.forEach(instance => {
          metadataProvider.addImageIdToUIDs(instance.imageId, {
            StudyInstanceUID,
            SeriesInstanceUID: instance.SeriesInstanceUID,
            SOPInstanceUID: instance.SOPInstanceUID,
          });
        });
      });

      // Finally, store the series and instance data into the DicomMetadataStore.
      const seriesMetadata = Object.values(seriesSummaryMetadata);
      DicomMetadataStore.addSeriesMetadata(seriesMetadata, madeInClient);

      Object.keys(instancesPerSeries).forEach(seriesInstanceUID =>
        DicomMetadataStore.addInstances(instancesPerSeries[seriesInstanceUID], madeInClient)
      );

      // At this point the hanging protocol is notified of the data and things should begin drawing
      // on screen.
      // This function replaces `_retrieveSeriesMetadataSync` as a more optimal method of retrieval.
      // Further optimization can be achieved if the DicomWeb standard supported an API like GraphQL.
      // These changes improved load times for a study from seconds to a second overall and transfers
      // of metadata decreased from 29 MB to 1.2MB overall. Image fetching is what slows down the system
      // now.
      return seriesSummaryMetadata;
    },

    _retrieveSeriesMetadataAsync: async (
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient = false,
      returnPromises = false
    ) => {
      const enableStudyLazyLoad = true;
      // Skip inclusion of Accept Header options other than the request type of `application/dicom+json`
      // See issue #5288
      wadoDicomWebClient.headers = generateWadoHeader(true);
      // Get Series
      const results: RetrieveStudyMetadataInterface =
        await retrieveStudyMetadata(
          wadoDicomWebClient,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction,
          dicomWebConfig
        );
      const { preLoadData: seriesSummaryMetadata, promises: seriesPromises } = results;

      // Async load series, store as retrieved
      function storeInstances(instances) {
        const naturalizedInstances = dicomWebToDicomStructure(instances)
          .map(instance =>
            addRetrieveBulkData(
              instance,
              qidoDicomWebClient,
              dicomWebConfig
            ));

        // Adding instanceMetadata to OHIF MetadataProvider
        naturalizedInstances.forEach(instance => {
          instance.wadoRoot = dicomWebConfig.wadoRoot;
          instance.wadoUri = dicomWebConfig.wadoUri;

          const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
          const numberOfFrames = instance.NumberOfFrames || 1;
          // Process all frames consistently, whether single or multiframe
          for (let i = 0; i < numberOfFrames; i++) {
            const frameNumber = i + 1;
            const frameImageId = getImageIdsForInstance(
              instance,
              frameNumber,
              dicomWebConfig,
            );
            // Add imageId specific mapping to this data as the URL isn't necessarily WADO-URI.
            metadataProvider.addImageIdToUIDs(frameImageId, {
              StudyInstanceUID,
              SeriesInstanceUID,
              SOPInstanceUID,
              frameNumber: numberOfFrames > 1 ? frameNumber : undefined,
            });
          }

          // Adding imageId to each instance
          // Todo: This is not the best way I can think of to let external
          // metadata handlers know about the imageId that is stored in the store
          const imageId = getImageIdsForInstance(
            instance,
            undefined,
            dicomWebConfig,
          );
          instance.imageId = imageId;
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

      const seriesDeliveredPromises = seriesPromises.map(promise => {
        if (!returnPromises) {
          promise?.start();
        }

        return promise.then(instances => {
          storeInstances(instances);
        });
      });

      if (returnPromises) {
        Promise.all(seriesDeliveredPromises).then(() => setSuccessFlag());
        return seriesPromises;
      } else {
        await Promise.all(seriesDeliveredPromises);
        setSuccessFlag();
      }

      return seriesSummaryMetadata;
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
            const imageId = getImageIdsForInstance(
              instance,
              frame,
              dicomWebConfig,
            );
            imageIds.push(imageId);
          }
        } else {
          const imageId = getImageIdsForInstance(
            instance,
            undefined,
            dicomWebConfig,
          );
          imageIds.push(imageId);
        }
      });

      return imageIds;
    },
    getConfig() {
      return dicomWebConfigCopy;
    },
    getStudyInstanceUIDs({ params, query }) {
      const paramsStudyInstanceUIDs = params.StudyInstanceUIDs || params.studyInstanceUIDs;

      const queryStudyInstanceUIDs = utils.splitComma(
        query.getAll('StudyInstanceUIDs').concat(query.getAll('studyInstanceUIDs'))
      );

      const StudyInstanceUIDs =
        (queryStudyInstanceUIDs.length && queryStudyInstanceUIDs) || paramsStudyInstanceUIDs;
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs];

      return StudyInstanceUIDsAsArray;
    },
  };

  if (dicomWebConfig.supportsReject) {
    implementation.reject = dcm4cheeReject(dicomWebConfig.wadoRoot, getAuthorizationHeader);
  }

  return IWebApiDataSource.create(implementation);
}

export { createDicomWebMinimalApi };
