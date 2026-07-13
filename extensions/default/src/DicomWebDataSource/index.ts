import { api } from 'dicomweb-client';
import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler, classes } from '@ohif/core';

import {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
} from './qido.js';
import dcm4cheeReject from './dcm4cheeReject.js';

import getImageId from './utils/getImageId.js';
import dcmjs from 'dcmjs';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from './retrieveStudyMetadata.js';
import StaticWadoClient from './utils/StaticWadoClient';
import getDirectURL from '../utils/getDirectURL';
import { fixBulkDataURI } from './utils/fixBulkDataURI';
import { HeadersInterface } from '@ohif/core/src/types/RequestHeaders';
import {
  getDatasetTransferSyntaxUID,
  setNonEnumerableInstanceProperty,
  writeDicomDictToPart10Buffer,
} from '../utils/dicomWriter';
import { getGetThumbnailSrc, ThumbnailContext } from './retrieveThumbnail';
import { getRenderedURL } from './retrieveRendered';
import retrieveBulkData from './retrieveBulkData';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-3.11.0';

const metadataProvider = classes.MetadataProvider;

export type DicomWebConfig = {
  /** Data source name */
  name: string;
  //  wadoUriRoot - Legacy? (potentially unused/replaced)
  /** Base URL to use for QIDO requests */
  qidoRoot?: string;
  wadoRoot?: string; // - Base URL to use for WADO requests
  wadoUri?: string; // - Base URL to use for WADO URI requests
  qidoSupportsIncludeField?: boolean; // - Whether QIDO supports the "Include" option to request additional fields in response
  imageRendering?: string; // - wadors | ? (unsure of where/how this is used)
  thumbnailRendering?: string;
  /**
   wadors - render using the wadors fetch.  The full image is retrieved and rendered in cornerstone to thumbnail size  png and returned as binary data to the src attribute of the  image tag.
           for example,  <img  src=data:image/png;base64,sdlfk;adkfadfk....asldfjkl;asdkf>
   thumbnailDirect -  get the direct url endpoint for the thumbnail as the image src (eg not authentication required).
           for example, <img src=http://server:port/wadors/studies/1.2.3/thumbnail?accept=image/jpeg>
   thumbnail - render using the thumbnail endpoint on wadors using bulkDataURI, passing authentication params  to the url.
    rendered - should use the rendered endpoint instead of the thumbnail endpoint
*/
  thumbnailRequestStrategy?: 'bulkDataRetrieve' | 'fetch';
  /**
   * Thumbnail data request strategy when `thumbnailRendering` is `thumbnail`/`rendered`; ignored for `wadors`/`thumbnailDirect`.
   *
   * - `bulkDataRetrieve` (default): Uses the DICOMweb client's bulk data retrieve API (`retrieveBulkData`)
   * - `fetch`: `GET` the WADO-RS thumbnail or rendered resource URL with auth headers and use the
   *          response body as a JPEG blob URL. For series-level context, if that `GET` fails, a single
   *          QIDO instances query (`limit=1`) is used to obtain `SOPInstanceUID` and the fetch is retried once.
   */
  /** Whether the server supports reject calls (i.e. DCM4CHEE) */
  supportsReject?: boolean;
  /** indicates if the retrieves can fetch singlepart. Options are bulkdata, video, image, or  true */
  singlepart?: boolean | string;
  /** Transfer syntax to request from the server */
  requestTransferSyntaxUID?: string;
  acceptHeader?: string[]; // - Accept header to use for requests
  /** Whether to omit quotation marks for multipart requests */
  omitQuotationForMultipartRequest?: boolean;
  /** Whether the server supports fuzzy matching */
  supportsFuzzyMatching?: boolean;
  /** Whether the server supports wildcard matching */
  supportsWildcard?: boolean;
  /** Whether the server supports the native DICOM model */
  supportsNativeDICOMModel?: boolean;
  /** Whether to enable request tag */
  enableRequestTag?: boolean;
  /** Whether to enable study lazy loading */
  enableStudyLazyLoad?: boolean;
  /** Whether to enable bulkDataURI */
  bulkDataURI?: BulkDataURIConfig;
  /** Function that is called after the configuration is initialized */
  onConfiguration: (config: DicomWebConfig, params) => DicomWebConfig;
  /** Whether to use the static WADO client */
  staticWado?: boolean;
  /** User authentication service */
  userAuthenticationService: Record<string, unknown>;
};

export type BulkDataURIConfig = {
  /** Enable bulkdata uri configuration */
  enabled?: boolean;
  /**
   * Remove the startsWith string.
   * This is used to correct reverse proxied URLs by removing the startsWith path
   */
  startsWith?: string;
  /**
   * Adds this prefix path.  Only used if the startsWith is defined and has
   * been removed.  This allows replacing the base path.
   */
  prefixWith?: string;
  /** Transform the bulkdata path.  Used to replace a portion of the path */
  transform?: (uri: string) => string;
  /**
   * Adds relative resolution to the path handling.
   * series is the default, as the metadata retrieved is series level.
   */
  relativeResolution?: 'studies' | 'series';
};

/**
 * The header options are the options passed into the generateWadoHeader
 * command.  This takes an extensible set of attributes to allow future enhancements.
 */
export interface HeaderOptions {
  includeTransferSyntax?: boolean;
}

/**
 * Metadata and some other requests don't permit the transfer syntax to be included,
 * so pass in the excludeTransferSyntax parameter.
 */
export const excludeTransferSyntax: HeaderOptions = { includeTransferSyntax: false };

/**
 * Creates a DICOM Web API based on the provided configuration.
 *
 * @param dicomWebConfig - Configuration for the DICOM Web API
 * @returns DICOM Web API object
 */
function createDicomWebApi(dicomWebConfig: DicomWebConfig, servicesManager) {
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

  /**
   * Adds the retrieve bulkdata function to naturalized DICOM data.
   * This is done recursively, for sub-sequences. Shared by both the lazy
   * (async) and non-lazy (sync) series-metadata retrieval paths.
   */
  const addRetrieveBulkDataNaturalized = (naturalized, instance = naturalized) => {
    if (!naturalized) {
      return naturalized;
    }
    for (const key of Object.keys(naturalized)) {
      const value = naturalized[key];

      if (Array.isArray(value) && typeof value[0] === 'object') {
        // Fix recursive values
        const validValues = value.filter(Boolean);
        validValues.forEach(child => addRetrieveBulkDataNaturalized(child, instance));
        continue;
      }

      // The value.Value will be set with the bulkdata read value
      // in which case it isn't necessary to re-read this.
      if (value && value.BulkDataURI && !value.Value) {
        // handle the scenarios where bulkDataURI is relative path
        fixBulkDataURI(value, instance, dicomWebConfig);
        // Provide a method to fetch bulkdata
        value.retrieveBulkData = retrieveBulkData.bind(qidoDicomWebClient, value);
      }
    }
    return naturalized;
  };

  /**
   * naturalizes the dataset, and adds a retrieve bulkdata method
   * to any values containing BulkDataURI.
   * @param {*} instance
   * @returns naturalized dataset, with retrieveBulkData methods
   */
  const addRetrieveBulkData = instance => {
    const naturalized = naturalizeDataset(instance);

    // if we know the server doesn't use bulkDataURI, then don't
    if (!dicomWebConfig.bulkDataURI?.enabled) {
      return naturalized;
    }

    return addRetrieveBulkDataNaturalized(naturalized);
  };

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

      /**
       * Generates the wado header for requesting resources from DICOMweb.
       * These are classified into those that are dependent on the transfer syntax
       * and those that aren't, as defined by the include transfer syntax attribute.
       */
      generateWadoHeader = (options: HeaderOptions): HeadersInterface => {
        const authorizationHeader = getAuthorizationHeader();
        if (options?.includeTransferSyntax !== false) {
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
          // The base header will be included in the request. We simply skip customization options around
          // transfer syntaxes and whether the request is multipart. In other words, a request in
          // which the server expects Accept: application/dicom+json will still include that in the
          // header.
          return {
            ...authorizationHeader,
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

      getGetThumbnailSrc: function (thumbnailContext: ThumbnailContext, imageId) {
        return getGetThumbnailSrc({
          thumbnailContext,
          imageId,
          config: dicomWebConfig,
          getAuthorizationHeader,
          qidoDicomWebClient,
          retrieve: this,
        });
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
      renderedURL: (params, options) => {
        return getRenderedURL({
          config: dicomWebConfig,
          getAuthorizationHeader,
          retrieve: implementation.retrieve,
          userAuthenticationService,
        })(params, options);
      },
      /**
       * Provide direct access to the dicom web client for certain use cases
       * where the dicom web client is used by an external library such as the
       * microscopy viewer.
       * Note this instance only needs to support the wado queries, and may not
       * support any QIDO or STOW operations.
       */
      getWadoDicomWebClient: () => wadoDicomWebClient,

      /**
       * Best-effort prefetch of a whole multiframe instance as a single Part 10
       * object, registered into the Cornerstone3D NATURALIZED frame registry so
       * subsequent per-frame image loads are served locally instead of issuing
       * one network request per frame (see the "Behaviours" doc
       * segmentation-multiframe-part10-prefetch).
       *
       * Whether to use it at all is the caller's policy (the SEG handler
       * resolves the `loadMultiframeAsPart10` config/customization, defaulting
       * it on — per-frame loading is the explicit opt-out there).
       * Never throws into the caller — on any failure it resolves `done` to
       * `false` and the normal per-frame load path is used.
       *
       * @returns `{ done: Promise<boolean>, cancel: () => void }`.
       */
      prefetchInstanceFrames: ({ instance, imageId }) => {
        const noop = { done: Promise.resolve(false), cancel: () => {} };

        if (!instance || !imageId) {
          return noop;
        }

        const StudyInstanceUID = instance.StudyInstanceUID;
        const SeriesInstanceUID = instance.SeriesInstanceUID;
        const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;

        if (!StudyInstanceUID || !SeriesInstanceUID || !SOPInstanceUID) {
          return noop;
        }

        let cancelled = false;

        // Lazy resolver: dicomweb-client.retrieveInstance returns the Part 10
        // instance as an ArrayBuffer, unwrapping multipart/related transparently
        // (and returning the raw object for single-part responses).
        const resolvePart10 = async () => {
          wadoDicomWebClient.headers = getAuthorizationHeader();
          const result = await wadoDicomWebClient.retrieveInstance({
            studyInstanceUID: StudyInstanceUID,
            seriesInstanceUID: SeriesInstanceUID,
            sopInstanceUID: SOPInstanceUID,
          });

          if (cancelled) {
            throw new Error('prefetchInstanceFrames cancelled');
          }

          if (result instanceof ArrayBuffer) {
            return result;
          }
          if (Array.isArray(result) && result[0] instanceof ArrayBuffer) {
            return result[0];
          }
          if (result && (result as { buffer?: ArrayBuffer }).buffer instanceof ArrayBuffer) {
            return (result as ArrayBufferView).buffer as ArrayBuffer;
          }
          throw new Error('Unexpected retrieveInstance result for instance prefetch');
        };

        const done = (async () => {
          try {
            await dicomImageLoader.prefetchPart10Instance(imageId, resolvePart10);
            return !cancelled;
          } catch (error) {
            console.warn(
              '[prefetchInstanceFrames] full-instance prefetch failed; falling back to per-frame loads',
              error
            );
            return false;
          }
        })();

        return {
          done,
          cancel: () => {
            cancelled = true;
          },
        };
      },

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
              TransferSyntaxUID: getDatasetTransferSyntaxUID(dataset),
              ImplementationClassUID,
              ImplementationVersionName,
            };

            const denaturalized = denaturalizeDataset(meta);
            const defaultDicomDict = new DicomDict(denaturalized);
            defaultDicomDict.dict = denaturalizeDataset(dataset);

            effectiveDicomDict = defaultDicomDict;
          }

          const part10Buffer = writeDicomDictToPart10Buffer(effectiveDicomDict);

          const options = {
            datasets: [part10Buffer],
            request,
          };

          await wadoDicomWebClient.storeInstances(options);
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
      wadoDicomWebClient.headers = generateWadoHeader(excludeTransferSyntax);
      // data is all SOPInstanceUIDs
      const data = await retrieveStudyMetadata(
        wadoDicomWebClient,
        StudyInstanceUID,
        enableStudyLazyLoad,
        filters,
        sortCriteria,
        sortFunction,
        dicomWebConfig
      );

      // first naturalize the data, attaching bulkdata retrieve methods so that
      // bulkdata-valued tags can be resolved (matching the lazy-load path).
      const naturalizedInstancesMetadata = data.map(addRetrieveBulkData);

      // Resolve the registered bulkdata tags (e.g. the Philips SUV Scale
      // Factor) delivered as bulkdata into plain numbers BEFORE
      // INSTANCES_ADDED fires. retrieveBulkData is bound to qidoDicomWebClient,
      // so refresh its auth headers first (matching every other qido op here).
      qidoDicomWebClient.headers = getAuthorizationHeader();
      await utils.resolveBulkDataTags(naturalizedInstancesMetadata);

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

        setNonEnumerableInstanceProperty(instance, 'imageId', imageId);
        setNonEnumerableInstanceProperty(instance, 'wadoRoot', dicomWebConfig.wadoRoot);
        setNonEnumerableInstanceProperty(instance, 'wadoUri', dicomWebConfig.wadoUri);

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
      wadoDicomWebClient.headers = generateWadoHeader(excludeTransferSyntax);
      // Get Series
      const { preLoadData: seriesSummaryMetadata, promises: seriesPromises } =
        await retrieveStudyMetadata(
          wadoDicomWebClient,
          StudyInstanceUID,
          enableStudyLazyLoad,
          filters,
          sortCriteria,
          sortFunction,
          dicomWebConfig
        );

      // Async load series, store as retrieved
      async function storeInstances(instances) {
        const naturalizedInstances = instances.map(addRetrieveBulkData);

        // Resolve the registered bulkdata tags (e.g. the Philips SUV Scale
        // Factor) that the server delivered as bulkdata into plain numbers
        // BEFORE INSTANCES_ADDED fires, so SUV scaling and every other
        // subscriber read a fully-resolved value rather than an unresolved
        // { BulkDataURI }. retrieveBulkData is bound to qidoDicomWebClient, so
        // refresh its auth headers first (matching every other qido op here).
        qidoDicomWebClient.headers = getAuthorizationHeader();
        await utils.resolveBulkDataTags(naturalizedInstances);

        // Adding instanceMetadata to OHIF MetadataProvider
        naturalizedInstances.forEach(instance => {
          setNonEnumerableInstanceProperty(instance, 'wadoRoot', dicomWebConfig.wadoRoot);
          setNonEnumerableInstanceProperty(instance, 'wadoUri', dicomWebConfig.wadoUri);

          const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
          const numberOfFrames = instance.NumberOfFrames || 1;
          // Process all frames consistently, whether single or multiframe
          for (let i = 0; i < numberOfFrames; i++) {
            const frameNumber = i + 1;
            const frameImageId = implementation.getImageIdsForInstance({
              instance,
              frame: frameNumber,
            });
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
          const imageId = implementation.getImageIdsForInstance({
            instance,
          });
          setNonEnumerableInstanceProperty(instance, 'imageId', imageId);
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

      let completedSeriesCount = 0;
      const seriesDeliveredPromises = seriesPromises.map(promise => {
        let deliveredPromise;

        return {
          metadata: promise.metadata,
          start: () => {
            if (!deliveredPromise) {
              deliveredPromise = promise.start().then(async instances => {
                await storeInstances(instances);

                completedSeriesCount++;
                if (returnPromises && completedSeriesCount === seriesPromises.length) {
                  setSuccessFlag();
                }

                return instances;
              });
            }

            return deliveredPromise;
          },
        };
      });

      if (returnPromises) {
        if (!seriesDeliveredPromises.length) {
          setSuccessFlag();
        }

        // The route starts only the series required by the hanging protocol,
        // then starts the remainder in the background. Return wrappers whose
        // start() resolves after async metadata post-processing has stored the
        // instances and fired INSTANCES_ADDED; resolving the raw retrieval here
        // races hanging-protocol application against display-set creation.
        return seriesDeliveredPromises;
      } else {
        await Promise.all(seriesDeliveredPromises.map(promise => promise.start()));
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
        config: dicomWebConfig,
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

export { createDicomWebApi };
