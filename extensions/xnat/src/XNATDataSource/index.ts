import { api } from 'dicomweb-client';
import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler, classes } from '@ohif/core';
import {
  getXNATStatusFromStudyInstanceUID,
  getSeriesXNATInstancesMetadata,
  convertToAbsoluteUrl,
  setupDisplaySetLogging,
  // processDataHandler, // Assuming this is from DataSourceUtils, uncomment if used and present
} from './Utils/DataSourceUtils';
import { getSOPClassUIDForModality } from './Utils/SOPUtils';
import { ensureInstanceRequiredFields } from './Utils/instanceUtils';
import {
  generateRandomUID, // Added from backup
  extractStudyUIDFromURL // Added from backup
} from './Utils/UIDUtils'; // Assuming UIDUtils.js exists
import {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
} from './qido';
import dcm4cheeReject from '../DicomWebDataSource/dcm4cheeReject.js';

import getImageId from '../DicomWebDataSource/utils/getImageId.js';
import dcmjs from 'dcmjs';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from '../DicomWebDataSource/retrieveStudyMetadata.js';
import StaticWadoClient from '../DicomWebDataSource/utils/StaticWadoClient';
import getDirectURL from '../utils/getDirectURL';
import { fixBulkDataURI } from '../DicomWebDataSource/utils/fixBulkDataURI';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

// Define the logger
const log = {
  debug: (message: string, ...args: any[]) => {
    console.debug(`XNATDataSource: ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`XNATDataSource: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`XNATDataSource: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`XNATDataSource: ${message}`, ...args);
  }
};

/**
 * Determines the appropriate image loader scheme based on the provided DICOM URL.
 * @param url - The URL to the DICOM file or DICOMweb endpoint
 * @param preferredScheme - The preferred scheme to use, defaults to 'wadouri'
 * @returns A properly formatted imageId string
 */
const getAppropriateImageId = (url: string, preferredScheme = 'wadouri'): string => {
  if (!url) {
    log.warn('XNAT: Empty URL provided to getAppropriateImageId');
    return '';
  }
  // If URL already has a scheme, respect it
  if (url.includes(':') &&
      !url.startsWith('http://') &&
      !url.startsWith('https://') &&
      !url.startsWith('dicomweb:')) {
    return url;
  }

  // For HTTP(S) URLs, always use dicomweb: prefix
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const imageId = `dicomweb:${url}`;
    return imageId;
  }

  // For relative URLs that don't have a scheme yet
  if (!url.includes(':')) {
    const imageId = `dicomweb:${url}`;
    return imageId;
  }

  // If already has dicomweb: prefix, return as is
  return url;
};


const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-VIEWER-2.0.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

const metadataProvider = classes.MetadataProvider;
export type XNATDataSourceConfig = {
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
  /** Whether the server supports reject calls (i.e. DCM4CHEE) */
  supportsReject?: boolean;
  /** Request series meta async instead of blocking */
  lazyLoadStudy?: boolean;
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
  onConfiguration: (config: XNATDataSourceConfig, params) => XNATDataSourceConfig;
  /** Whether to use the static WADO client */
  staticWado?: boolean;
  /** User authentication service */
  userAuthenticationService: Record<string, unknown>;
  /** XNAT specific configuration */
  xnat?: {
    projectId?: string;
    subjectId?: string;
    sessionId?: string;
    experimentId?: string;
  };
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

interface InstanceMetadataForStore {
  Modality?: string;
  modality?: string;
  SOPInstanceUID?: string;
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  SOPClassUID?: string;
  [key: string]: any; // For other DICOM tags
}


/**
 * Creates a DICOM Web API based on the provided configuration.
 *
 * @param xnatConfig - Configuration for the DICOM Web API
 * @returns DICOM Web API object
 */
function createDataSource(xnatConfig: XNATDataSourceConfig, servicesManager) {
  const { userAuthenticationService } = servicesManager.services;
  let xnatConfigCopy: XNATDataSourceConfig, // Renamed from dicomWebConfigCopy
    qidoConfig,
    wadoConfig,
    qidoDicomWebClient,
    wadoDicomWebClient,
    getAuthorizationHeader,
    generateWadoHeader;
  // Default to enabling bulk data retrieves, with no other customization as
  // this is part of hte base standard.
  log.info('XNATDataSource: createDataSource'); // Updated log
  xnatConfig.bulkDataURI ||= { enabled: true };
  xnatConfigCopy = { ...xnatConfig }; // Initialize early

  const implementation = {
    initialize: ({ params, query }) => {
      log.info('XNATDataSource: initialize started. Initial xnatConfig:', JSON.parse(JSON.stringify(xnatConfig)));
      log.info('XNATDataSource: initialize params:', params);
      log.info('XNATDataSource: initialize query:', query);

      setupDisplaySetLogging();
      log.info('XNAT: Display set logging initialized');

      xnatConfig.xnat = xnatConfig.xnat || {};

      const queryProjectId = params?.projectId || query?.get('projectId');
      const queryExperimentId = params?.experimentId || query?.get('experimentId');
      const querySessionId = params?.sessionId || query?.get('sessionId');
      const querySubjectId = params?.subjectId || query?.get('subjectId');

      if (queryProjectId) xnatConfig.xnat.projectId = queryProjectId;
      if (queryExperimentId) xnatConfig.xnat.experimentId = queryExperimentId;
      if (querySessionId) xnatConfig.xnat.sessionId = querySessionId;
      if (querySubjectId) xnatConfig.xnat.subjectId = querySubjectId;

      log.info('XNAT IDs extracted and stored in xnatConfig.xnat:', xnatConfig.xnat);


      if (xnatConfig.onConfiguration && typeof xnatConfig.onConfiguration === 'function') {
        xnatConfig = xnatConfig.onConfiguration(xnatConfig, {
          params,
          query,
        });
      }

      xnatConfigCopy = JSON.parse(JSON.stringify(xnatConfig));
      log.info('XNATDataSource: xnatConfigCopy created:', JSON.parse(JSON.stringify(xnatConfigCopy)));


      getAuthorizationHeader = () => {
        log.info('XNATDataSource: getAuthorizationHeader'); // Updated log
        const xhrRequestHeaders: Record<string, string> = {};
        const authHeaders = userAuthenticationService.getAuthorizationHeader();
        if (authHeaders && typeof authHeaders === 'object' && 'Authorization' in authHeaders && authHeaders.Authorization) {
          xhrRequestHeaders.Authorization = authHeaders.Authorization as string;
        }
        return xhrRequestHeaders;
      };

      generateWadoHeader = () => {
        log.info('XNATDataSource: generateWadoHeader'); // Updated log
        const authorizationHeader = getAuthorizationHeader();
        //Generate accept header depending on config params
        const formattedAcceptHeader = utils.generateAcceptHeader(
          xnatConfig.acceptHeader,
          xnatConfig.requestTransferSyntaxUID,
          xnatConfig.omitQuotationForMultipartRequest
        );

        return {
          ...authorizationHeader,
          Accept: formattedAcceptHeader,
        };
      };
      log.info('XNATDataSource: qidoConfig setup'); // Updated log
      qidoConfig = {
        url: xnatConfig.qidoRoot,
        staticWado: xnatConfig.staticWado,
        singlepart: xnatConfig.singlepart,
        headers: userAuthenticationService.getAuthorizationHeader(),
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
      };
      log.info('XNATDataSource: wadoConfig setup'); // Updated log
      wadoConfig = {
        url: xnatConfig.wadoRoot,
        staticWado: xnatConfig.staticWado,
        singlepart: xnatConfig.singlepart,
        headers: userAuthenticationService.getAuthorizationHeader(),
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
      };
      log.info('XNATDataSource: qidoDicomWebClient setup'); // Updated log
      qidoDicomWebClient = xnatConfig.staticWado
        ? new StaticWadoClient(qidoConfig)
        : new api.DICOMwebClient(qidoConfig);

      wadoDicomWebClient = xnatConfig.staticWado
        ? new StaticWadoClient(wadoConfig)
        : new api.DICOMwebClient(wadoConfig);
      log.info('XNATDataSource: initialize completed.');
    },
    query: {
      studies: {
        mapParams: mapParams.bind({}), // Consider if mapParams needs config
        search: async function (origParams) {
          let studyInstanceUid = origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
          if (!studyInstanceUid && typeof origParams === 'object' && origParams !== null) {
            if (origParams.studyInstanceUid) {
              studyInstanceUid = origParams.studyInstanceUid;
            }
          }

          const { projectId, experimentId } = getXNATStatusFromStudyInstanceUID(studyInstanceUid, xnatConfigCopy);

          log.info('XNAT study search using:', { projectId, experimentId, studyInstanceUid });

          if (!projectId || !experimentId) {
            log.error('XNAT: Missing projectId or experimentId for metadata fetch in search');
            log.error('XNAT: Please provide these values in URL parameters or configuration');
            // Fallback to DICOMweb search if XNAT specific identifiers are missing
          } else {
            try {
              const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);

              if (!xnatMetadata || !xnatMetadata.studies || !xnatMetadata.studies.length) {
                log.error('XNAT: No valid metadata returned from XNAT API in search');
                return [];
              }

              const results = [];
              xnatMetadata.studies.forEach(study => {
                const result = {
                  "00080020": { vr: "DA", Value: [study.StudyDate || ""] },
                  "00080030": { vr: "TM", Value: [study.StudyTime || ""] },
                  "00080050": { vr: "SH", Value: [study.AccessionNumber || ""] },
                  "00080054": { vr: "AE", Value: [xnatConfigCopy.qidoRoot || ""] },
                  "00080056": { vr: "CS", Value: ["ONLINE"] },
                  "00080061": { vr: "CS", Value: study.ModalitiesInStudy || study.Modalities || (study.series && study.series.length > 0 ? Array.from(new Set(study.series.map(s => s.Modality).filter(Boolean))) : ["UNKNOWN"]) },
                  "00080090": { vr: "PN", Value: [{ Alphabetic: study.ReferringPhysicianName || "" }] },
                  "00081190": { vr: "UR", Value: [xnatConfigCopy.qidoRoot || ""] },
                  "00100010": { vr: "PN", Value: [{ Alphabetic: study.PatientName || "Anonymous" }] },
                  "00100020": { vr: "LO", Value: [study.PatientID || ""] },
                  "00100030": { vr: "DA", Value: [study.PatientBirthDate || ""] },
                  "00100040": { vr: "CS", Value: [study.PatientSex || ""] },
                  "0020000D": { vr: "UI", Value: [studyInstanceUid || study.StudyInstanceUID || xnatMetadata.transactionId || generateRandomUID()] },
                  "00200010": { vr: "SH", Value: [study.StudyID || ""] },
                  "00081030": { vr: "LO", Value: [study.StudyDescription || "XNAT Study"] }
                };
                if (study.series && study.series.length) {
                  result["00201206"] = { vr: "IS", Value: [study.series.length.toString()] };
                }
                results.push(result);
              });
              return results;
            } catch (error) {
              log.error('XNAT: Error in XNAT-specific study search:', error);
              // Fall through to DICOMweb search on error
            }
          }

          // Fallback to traditional DICOMweb search
          log.warn('XNAT: Falling back to DICOMweb search for studies.');
          if (!qidoDicomWebClient) {
            log.error('qidoDicomWebClient not available - DICOMweb search will fail');
            return [];
          }
          qidoDicomWebClient.headers = getAuthorizationHeader();
          const validOrigParams = typeof origParams === 'object' && origParams !== null ? origParams : {};
          const mappedResult = mapParams(validOrigParams, {
            supportsFuzzyMatching: xnatConfigCopy.supportsFuzzyMatching,
            supportsWildcard: xnatConfigCopy.supportsWildcard,
          });
          const paramMap: Record<string, any> = typeof mappedResult === 'object' && mappedResult !== null ? mappedResult : {};
          const queryStudyInstanceUid = paramMap.studyInstanceUID || origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
          const querySeriesInstanceUid = paramMap.seriesInstanceUID;
          delete paramMap.studyInstanceUID;
          delete paramMap.seriesInstanceUID;
          const dicomWebResults = await qidoSearch(qidoDicomWebClient, queryStudyInstanceUid, querySeriesInstanceUid, paramMap);
          return processResults(dicomWebResults);
        },
        processResults: processResults,
      },
      series: {
        search: async function (studyInstanceUID, filters) {
          if (!qidoDicomWebClient) {
            log.error('qidoDicomWebClient not available - series search may fail');
            return [];
          }
          qidoDicomWebClient.headers = getAuthorizationHeader();

          let currentStudyInstanceUID = studyInstanceUID;
          if (typeof studyInstanceUID === 'object' && studyInstanceUID !== null) {
            currentStudyInstanceUID = studyInstanceUID.StudyInstanceUID || studyInstanceUID.studyInstanceUID;
          }
          if (typeof currentStudyInstanceUID !== 'string') {
            log.error('XNAT series search: Unable to determine studyInstanceUID from', studyInstanceUID);
            return [];
          }

          log.info('XNAT series search: using studyInstanceUID', currentStudyInstanceUID);

          try {
            const results = await seriesInStudy(qidoDicomWebClient, currentStudyInstanceUID);
            log.info('XNAT series search: results', results);
            return processSeriesResults(results);
          } catch (error) {
            log.error('XNAT series search error:', error);
            return [];
          }
        },
      },
      instances: {
        search: (studyInstanceUid, seriesInstanceUid, queryParameters) => { // Added seriesInstanceUid
          log.info('XNATDataSource: instances.search'); // Updated log
          qidoDicomWebClient.headers = getAuthorizationHeader();
          return qidoSearch.call(
            undefined,
            qidoDicomWebClient,
            studyInstanceUid,
            seriesInstanceUid, // Pass seriesInstanceUid
            queryParameters
          );
        },
      },
    },
    retrieve: {
      getGetThumbnailSrc: function (instance, imageId) {
        if (xnatConfigCopy.thumbnailRendering === 'wadors') {
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
        if (xnatConfigCopy.thumbnailRendering === 'thumbnailDirect') {
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

        if (xnatConfigCopy.thumbnailRendering === 'thumbnail') {
          return async function getThumbnailSrc() {
            const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
            const bulkDataURI = `${xnatConfigCopy.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/thumbnail?accept=image/jpeg`;
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
        if (xnatConfigCopy.thumbnailRendering === 'rendered') {
          return async function getThumbnailSrc() {
            const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
            const bulkDataURI = `${xnatConfigCopy.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/rendered?accept=image/jpeg`;
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
            wadoRoot: xnatConfigCopy.wadoRoot,
            singlepart: xnatConfigCopy.singlepart,
          },
          params
        );
      },
      getWadoDicomWebClient: () => wadoDicomWebClient,
      bulkDataURI: async ({ StudyInstanceUID, BulkDataURI, instance }) => { // Added instance
        qidoDicomWebClient.headers = getAuthorizationHeader();
        // Only call fixBulkDataURI if we have a valid config with bulkDataURI settings
        let finalBulkDataURI = BulkDataURI;
        if (xnatConfigCopy && xnatConfigCopy.bulkDataURI && instance) {
             const tempValue = { BulkDataURI };
             fixBulkDataURI(tempValue, instance, xnatConfigCopy);
             finalBulkDataURI = tempValue.BulkDataURI;
        }

        const options = {
          multipart: false,
          BulkDataURI: finalBulkDataURI,
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
        }: {
          StudyInstanceUID: string;
          filters?: Record<string, any>;
          sortCriteria?: any;
          sortFunction?: (...args: any[]) => number;
          madeInClient?: boolean;
          returnPromises?: boolean;
        } = {} as any) => {
          if (!StudyInstanceUID) {
            log.error('XNAT: retrieve.series.metadata - Missing StudyInstanceUID');
            return Promise.reject(new Error('Missing StudyInstanceUID'));
          }

          log.info(
            `XNAT: retrieve.series.metadata for StudyInstanceUID: ${StudyInstanceUID}, returnPromises: ${returnPromises}, madeInClient: ${madeInClient}`
          );

          const retrieveSeriesMetadataAsync = async () => {
            log.info(`XNAT: retrieveSeriesMetadataAsync called for StudyUID: ${StudyInstanceUID}`);
            let seriesAndInstances;
            try {
              if (!xnatConfigCopy) {
                log.error('XNAT: xnatConfigCopy is not available in retrieveSeriesMetadataAsync.');
                xnatConfigCopy = xnatConfig; // Fallback, though this indicates a flow issue
              }
              // Use xnatConfigCopy.xnat which should be populated by initialize
              const projectId = xnatConfigCopy.xnat?.projectId;
              const experimentId = xnatConfigCopy.xnat?.experimentId || xnatConfigCopy.xnat?.sessionId;

              if (!projectId || !experimentId) {
                log.error(`XNAT: Missing projectId or experimentId in config for StudyInstanceUID ${StudyInstanceUID}. projectId: ${projectId}, experimentId: ${experimentId}`);
                 // Attempt to parse from StudyInstanceUID as a fallback
                const parsed = getXNATStatusFromStudyInstanceUID(StudyInstanceUID, xnatConfigCopy);
                if (parsed.projectId && parsed.experimentId) {
                  log.warn(`XNAT: Using parsed projectId ${parsed.projectId} and experimentId ${parsed.experimentId} from StudyInstanceUID`);
                  seriesAndInstances = await implementation.xnat.getExperimentMetadata(parsed.projectId, parsed.experimentId);
                } else {
                  log.error(`XNAT: Still unable to determine projectId or experimentId for ${StudyInstanceUID}. Cannot fetch experiment metadata.`);
                  throw new Error(`Cannot determine XNAT projectId/experimentId for ${StudyInstanceUID}`);
                }
              } else {
                seriesAndInstances = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
              }
              log.info(`XNAT: Fetched experiment metadata for ${StudyInstanceUID}`, seriesAndInstances);
            } catch (e) {
              log.error(
                `XNAT: Error fetching experiment metadata for StudyInstanceUID ${StudyInstanceUID}: `,
                e
              );
              throw e;
            }

            if (!seriesAndInstances || !seriesAndInstances.studies || seriesAndInstances.studies.length === 0) {
              log.warn(`XNAT: No studies found in experiment metadata for StudyInstanceUID ${StudyInstanceUID}`);
              return [];
            }

            const study = seriesAndInstances.studies.find(s => s.StudyInstanceUID === StudyInstanceUID);
            if (!study || !study.series || study.series.length === 0) {
              log.warn(`XNAT: No series found for StudyInstanceUID ${StudyInstanceUID} within the experiment data.`);
              return [];
            }

            log.info(`XNAT: retrieve.series.metadata - Found ${study.series.length} series in XNAT experiment for StudyUID ${StudyInstanceUID}`);

            const allNaturalizedInstancesForStudy = [];

            for (const series of study.series) {
              log.info(`XNAT: retrieveSeriesMetadataAsync - Iterating series: ${series.SeriesInstanceUID}`);
              const xnatInstances = series.instances || [];
              if (xnatInstances.length === 0) {
                log.warn(`XNAT: No instances for series ${series.SeriesInstanceUID}`);
                continue;
              }

              const naturalizedInstancesForThisSeries = [];
              const instancesToStoreForThisSeries = [];

              xnatInstances.forEach((xnatInstance, index) => {
                const xnatMeta = xnatInstance.metadata || {};
                const determinedModality = series.Modality || xnatMeta.Modality || 'Unknown';

                const sopInstanceUID = xnatMeta.SOPInstanceUID || generateRandomUID();
                const imageId = getAppropriateImageId(xnatConfigCopy.wadoRoot + xnatInstance.url, xnatConfigCopy.imageRendering);


                let naturalized = {
                  StudyInstanceUID,
                  SeriesInstanceUID: series.SeriesInstanceUID,
                  SOPInstanceUID: sopInstanceUID,
                  Modality: determinedModality,
                  modality: determinedModality,
                  imageId: imageId,
                  wadoRoot: xnatConfigCopy.wadoRoot, // For OHIF DicomMetadataStore
                  wadoUri: xnatConfigCopy.wadoUri,   // For OHIF DicomMetadataStore
                  ...(xnatMeta as any),
                  SOPClassUID: xnatMeta.SOPClassUID || getSOPClassUIDForModality(determinedModality),
                  InstanceNumber: xnatMeta.InstanceNumber || (index + 1).toString(),
                  NumberOfFrames: xnatMeta.NumberOfFrames || 1, // Ensure NumberOfFrames
                  // Add other fallbacks as needed for viewer display
                  Rows: xnatMeta.Rows || 512,
                  Columns: xnatMeta.Columns || 512,
                  PixelSpacing: xnatMeta.PixelSpacing || [1, 1],
                  SliceThickness: xnatMeta.SliceThickness || 1,
                  ImagePositionPatient: xnatMeta.ImagePositionPatient || [0,0,index],
                  ImageOrientationPatient: xnatMeta.ImageOrientationPatient || [1,0,0,0,1,0],
                  ImageType: xnatMeta.ImageType || 'ORIGINAL',
                  PhotometricInterpretation: xnatMeta.PhotometricInterpretation || (determinedModality === 'CT' || determinedModality === 'MR' || determinedModality === 'PT' ? 'MONOCHROME2' : 'RGB'),
                  SamplesPerPixel: xnatMeta.SamplesPerPixel || ((determinedModality === 'CT' || determinedModality === 'MR' || determinedModality === 'PT') ? 1 : 3),
                  PixelRepresentation: xnatMeta.PixelRepresentation === undefined ? ((determinedModality === 'MR' || determinedModality === 'CT') ? 1 : 0) : xnatMeta.PixelRepresentation,
                  BitsAllocated: xnatMeta.BitsAllocated || 16,
                  BitsStored: xnatMeta.BitsStored || (xnatMeta.BitsAllocated || 16),
                  HighBit: xnatMeta.HighBit === undefined ? ((xnatMeta.BitsStored || (xnatMeta.BitsAllocated || 16)) - 1) : xnatMeta.HighBit,
                };

                // Ensure required fields for DicomMetadataStore
                naturalized = ensureInstanceRequiredFields(naturalized, xnatConfigCopy);

                naturalizedInstancesForThisSeries.push(naturalized);
                allNaturalizedInstancesForStudy.push(naturalized);

                const dicomDatasetToDenaturalize = { ...naturalized };
                delete dicomDatasetToDenaturalize.imageId;
                delete dicomDatasetToDenaturalize.modality;
                delete dicomDatasetToDenaturalize.wadoRoot;
                delete dicomDatasetToDenaturalize.wadoUri;


                const storable = {
                  ...denaturalizeDataset(dicomDatasetToDenaturalize),
                  // Keep these JS properties for OHIF DicomMetadataStore compatibility
                  StudyInstanceUID,
                  SeriesInstanceUID: series.SeriesInstanceUID,
                  SOPInstanceUID: naturalized.SOPInstanceUID,
                  Modality: determinedModality,
                  modality: determinedModality,
                  SOPClassUID: naturalized.SOPClassUID,
                  InstanceNumber: naturalized.InstanceNumber,
                  url: imageId.startsWith('dicomweb:') ? imageId.substring(9) : imageId, // Store the actual URL part
                  imageId: imageId, // Full imageId for Cornerstone
                  Rows: naturalized.Rows,
                  Columns: naturalized.Columns,
                  PixelSpacing: naturalized.PixelSpacing,
                  SliceThickness: naturalized.SliceThickness,
                  ImagePositionPatient: naturalized.ImagePositionPatient,
                  ImageOrientationPatient: naturalized.ImageOrientationPatient,
                  ImageType: naturalized.ImageType,
                  NumberOfFrames: naturalized.NumberOfFrames,
                  PhotometricInterpretation: naturalized.PhotometricInterpretation,
                  SamplesPerPixel: naturalized.SamplesPerPixel,
                  PixelRepresentation: naturalized.PixelRepresentation,
                  BitsAllocated: naturalized.BitsAllocated,
                  BitsStored: naturalized.BitsStored,
                  HighBit: naturalized.HighBit,
                  wadoRoot: xnatConfigCopy.wadoRoot,
                  wadoUri: xnatConfigCopy.wadoUri,
                  SeriesDescription: series.SeriesDescription || '',
                };
                instancesToStoreForThisSeries.push(storable);

                // Add to metadataProvider for each frame
                const numberOfFrames = naturalized.NumberOfFrames || 1;
                for (let i = 0; i < numberOfFrames; i++) {
                  const frameNumber = i + 1;
                  const frameImageId = implementation.getImageIdsForInstance({
                    instance: naturalized, // Use the naturalized object with imageId
                    frame: numberOfFrames > 1 ? frameNumber : undefined,
                  });
                  metadataProvider.addImageIdToUIDs(frameImageId, {
                    StudyInstanceUID,
                    SeriesInstanceUID: series.SeriesInstanceUID,
                    SOPInstanceUID: naturalized.SOPInstanceUID,
                    frameNumber: numberOfFrames > 1 ? frameNumber : undefined,
                  });
                }

              });

              if (instancesToStoreForThisSeries.length > 0) {
                 log.info(`XNAT:retrieveSeriesMetadataAsync - Storing ${instancesToStoreForThisSeries.length} processed instances in DicomMetadataStore for series ${series.SeriesInstanceUID} (Study ${StudyInstanceUID})`);
                 DicomMetadataStore.addInstances(instancesToStoreForThisSeries, madeInClient);
              }
            }

            // Add Series level metadata (summary) to DicomMetadataStore
            const seriesSummaryMetadata = study.series.map(s => {
                log.info(`XNAT: Mapping series ${s.SeriesInstanceUID}, SeriesDescription from XNAT: '${s.SeriesDescription}'`);
                return {
                    StudyInstanceUID,
                    SeriesInstanceUID: s.SeriesInstanceUID,
                    Modality: s.Modality || "Unknown",
                    SeriesDescription: s.SeriesDescription || "XNAT Series",
                    SeriesNumber: s.SeriesNumber || "1",
                    // Add other relevant series tags from XNAT if available
                };
            });
            DicomMetadataStore.addSeriesMetadata(seriesSummaryMetadata, madeInClient);


            log.info(`XNAT: retrieveSeriesMetadataAsync - Returning ${allNaturalizedInstancesForStudy.length} total naturalized instances for study ${StudyInstanceUID}`);
            return allNaturalizedInstancesForStudy; // This return value is often expected to be series summaries
          };


          const setSuccessFlag = () => {
            const study = DicomMetadataStore.getStudy(StudyInstanceUID);
            if (!study) { return; }
            study.isLoaded = true;
          };


          if (returnPromises) {
            const promiseLike = {
              _promise: null,
              start: function() {
                if (!this._promise) {
                  this._promise = retrieveSeriesMetadataAsync();
                }
                return this._promise;
              },
              then: function(onFulfilled, onRejected) {
                if (!this._promise) { this.start(); }
                return this._promise.then(onFulfilled, onRejected).finally(setSuccessFlag);
              },
              catch: function(onRejected) {
                if (!this._promise) { this.start(); }
                return this._promise.catch(onRejected);
              }
            };
            // For XNAT, we might not have multiple series promises like in standard DICOMweb lazy load.
            // We return the main promise that resolves with all instance data for the study.
            // The caller expects an array of promises.
            return [promiseLike];
          } else {
            return retrieveSeriesMetadataAsync().finally(setSuccessFlag);
          }
        },
      },
      study: {
        metadata: async function (studyInstanceUIDParam, options: { batch?: boolean; madeInClient?: boolean } = {}) {
          let studyUid = studyInstanceUIDParam;
          if (typeof studyInstanceUIDParam === 'object' && studyInstanceUIDParam !== null) {
            studyUid = studyInstanceUIDParam.StudyInstanceUID;
          }
          log.info('XNAT retrieve study metadata', { studyUid });

          let projectId = xnatConfigCopy.xnat?.projectId;
          let experimentId = xnatConfigCopy.xnat?.experimentId || xnatConfigCopy.xnat?.sessionId;

          if ((!projectId || !experimentId) && studyUid) {
              const parsed = getXNATStatusFromStudyInstanceUID(studyUid, xnatConfigCopy);
              if (!projectId) projectId = parsed.projectId;
              if (!experimentId) experimentId = parsed.experimentId;
          }

          if (!projectId || !experimentId) {
            log.error('XNAT: Missing projectId or experimentId for metadata fetch. Params:', { studyUid, projectId, experimentId, configXnat: xnatConfigCopy.xnat });
            return null;
          }

          try {
            const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
            if (!xnatMetadata || !xnatMetadata.studies || xnatMetadata.studies.length === 0) {
              log.error('XNAT: No metadata returned from XNAT API or no studies in response.');
              return null;
            }
            log.info('XNAT: Successfully retrieved study metadata from XNAT API');

            const studyFromXnat = xnatMetadata.studies.find(s => s.StudyInstanceUID === studyUid);
            if (!studyFromXnat) {
                log.error(`XNAT: Study ${studyUid} not found in XNAT experiment ${experimentId} response.`);
                return null;
            }

            const studyMetadataForStore = {
              StudyInstanceUID: studyUid,
              PatientID: studyFromXnat.PatientID || 'Unknown',
              PatientName: studyFromXnat.PatientName || 'Unknown',
              StudyDate: studyFromXnat.StudyDate || '',
              StudyTime: studyFromXnat.StudyTime || '',
              AccessionNumber: studyFromXnat.AccessionNumber || '',
              ReferringPhysicianName: studyFromXnat.ReferringPhysicianName || '',
              PatientBirthDate: studyFromXnat.PatientBirthDate || '',
              PatientSex: studyFromXnat.PatientSex || '',
              StudyID: studyFromXnat.StudyID || '',
              StudyDescription: studyFromXnat.StudyDescription || 'XNAT Study',
              wadoRoot: xnatConfigCopy.wadoRoot,
              ModalitiesInStudy: studyFromXnat.ModalitiesInStudy || (studyFromXnat.series && studyFromXnat.series.length > 0 ? Array.from(new Set(studyFromXnat.series.map(s => s.Modality).filter(Boolean))) : []),
              NumInstances: studyFromXnat.NumInstances || (studyFromXnat.series ? studyFromXnat.series.reduce((acc, s) => acc + (s.instances ? s.instances.length : 0), 0) : 0),
              NumSeries: studyFromXnat.NumSeries || (studyFromXnat.series ? studyFromXnat.series.length : 0),
              xnatTransactionId: xnatMetadata.transactionId,
            };
            DicomMetadataStore.addStudy(studyMetadataForStore);
            log.info(`XNAT: Added/Updated study ${studyUid} in DicomMetadataStore.`);

            // The retrieve.series.metadata will handle instance and series population.
            // This function now primarily ensures the study-level summary is in the store.
            return studyMetadataForStore; // Return the summary
          } catch (error) {
            log.error('XNAT: Error retrieving or processing study metadata:', error);
            return null;
          }
        },
      }
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

    _retrieveSeriesMetadataSync: async (
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient
    ) => {
      // This is the DICOMweb sync path, XNAT primarily uses async due to its API structure
      // For XNAT, this might need to be adapted or could be less frequently used.
      log.warn('XNAT: _retrieveSeriesMetadataSync called, XNAT typically uses async. Forwarding to async...');
      return implementation._retrieveSeriesMetadataAsync(StudyInstanceUID, filters, sortCriteria, sortFunction, madeInClient, false);
    },

    _retrieveSeriesMetadataAsync: async ( // This is now the primary XNAT series/instance retrieval path
      StudyInstanceUID,
      filters,
      sortCriteria,
      sortFunction,
      madeInClient = false,
      returnPromises = false // This flag is important for how OHIF calls this
    ) => {
        // This function body is effectively replaced by retrieve.series.metadata's XNAT logic
        // We call the main retrieve.series.metadata here.
        log.info(`XNAT: _retrieveSeriesMetadataAsync (new wrapper) for ${StudyInstanceUID}`);
        return implementation.retrieve.series.metadata({
            StudyInstanceUID,
            filters,
            sortCriteria,
            sortFunction,
            madeInClient,
            returnPromises,
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
        const NumberOfFrames = instance.NumberOfFrames || 1; // Add fallback for NumberOfFrames

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
      // Ensure instance has necessary fields for getImageId
      const instanceForImageId = {
          ...instance,
          wadoRoot: xnatConfigCopy.wadoRoot, // Ensure wadoRoot is present
          wadoUri: xnatConfigCopy.wadoUri,   // Ensure wadoUri is present
      };
      const imageId = getImageId({ // Note: getImageId is imported from DicomWebDataSource utils
        instance: instanceForImageId,
        frame,
        config: xnatConfigCopy,
      });
      return imageId;
    },
    getConfig() {
      return xnatConfigCopy;
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
    xnat: {
      getExperimentMetadata: async (projectId, experimentId) => {
        const currentConfig = xnatConfigCopy || xnatConfig;
        log.info(`XNATDataSource: xnat.getExperimentMetadata attempting for ${projectId}/${experimentId} with URL ${currentConfig.wadoRoot}`);
        const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
        const baseUrl = currentConfig.wadoRoot || 'http://localhost';
        const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
        const headers = getAuthorizationHeader();
        log.info(`XNATDataSource: Fetching from apiUrl: ${apiUrl}`);
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', ...headers },
          });

          log.info(`XNATDataSource: Received response from ${apiUrl} - Status: ${response.status}, StatusText: ${response.statusText}, OK: ${response.ok}`);

          if (!response.ok) {
            const errorText = await response.text();
            log.error(`XNAT API error fetching experiment ${experimentId}: ${response.status} ${response.statusText}. Body: ${errorText}`);
            throw new Error(`XNAT API error: ${response.status} ${response.statusText}. Body: ${errorText}`);
          }
          let data;
          try {
            data = await response.json();
            log.info(`XNATDataSource: xnat.getExperimentMetadata successfully parsed JSON for ${experimentId}:`, data);
          } catch (jsonError) {
            log.error(`XNATDataSource: Failed to parse JSON response for ${experimentId}. URL: ${apiUrl}, Status: ${response.status}. Error:`, jsonError);
            const responseText = await response.text();
            log.error(`XNATDataSource: Raw response text for ${experimentId}: ${responseText}`);
            throw jsonError;
          }
          return data;
        } catch (fetchError) {
          log.error(`XNATDataSource: Error during fetch or processing for ${experimentId}. URL: ${apiUrl}. Error:`, fetchError);
          throw fetchError;
        }
      },
      getSubjectMetadata: async (projectId, subjectId) => {
        if (!projectId || !subjectId) {
          log.error('XNAT: Missing projectId or subjectId for metadata fetch');
          return null;
        }
        try {
          const currentConfig = xnatConfigCopy || xnatConfig;
          const baseUrl = currentConfig.wadoRoot || 'http://localhost';
          const apiPath = `/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
          const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
          const headers = getAuthorizationHeader();
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', ...headers }
          });
          if (!response.ok) {
            log.error('XNAT: Failed to fetch subject metadata', response.status, response.statusText);
            throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          return data;
        } catch (error) {
          log.error('XNAT: Error fetching subject metadata:', error);
          throw error;
        }
      },
      getProjectMetadata: async (projectId) => {
        if (!projectId) {
          log.error('XNAT: Missing projectId for metadata fetch');
          return null;
        }
        try {
          const currentConfig = xnatConfigCopy || xnatConfig;
          const baseUrl = currentConfig.wadoRoot || 'http://localhost';
          const apiPath = `/xapi/viewer/projects/${projectId}`;
          const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
          log.info('XNAT: Constructed API URL for Project Metadata:', apiUrl);
          const headers = getAuthorizationHeader();
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', ...headers }
          });
          if (!response.ok) {
            log.error('XNAT: Failed to fetch project metadata', response.status, response.statusText);
            throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          return data;
        } catch (error) {
          log.error('XNAT: Error fetching project metadata:', error);
          throw error;
        }
      }
    },
    reject: xnatConfig.supportsReject
      ? dcm4cheeReject(xnatConfig.wadoRoot, getAuthorizationHeader)
      : () => {
          log.warn('Reject operation is not supported by this XNAT data source.');
          return Promise.reject(new Error('Reject operation is not supported.'));
        },
  };

  return IWebApiDataSource.create(implementation);
}

/**
 * A bindable function that retrieves the bulk data against this as the
 * dicomweb client, and on the given value element.
 *
 * @param value - a bind value that stores the retrieve value to short circuit the
 *    next retrieve instance.
 * @param options - to allow specifying the content type.
 */
function retrieveBulkData(value, options: { mediaType?: string } = {}) {
  const { mediaType } = options;
  const useOptions = {
    multipart: false,
    BulkDataURI: value.BulkDataURI,
    mediaTypes: mediaType ? [{ mediaType }, { mediaType: 'application/octet-stream' }] : undefined,
    ...options,
  };
  // 'this' context should be qidoDicomWebClient, bound in addRetrieveBulkDataNaturalized
  return this.retrieveBulkData(useOptions).then(val => {
    const ret =
      (val instanceof Array && val.find(arrayBuffer => arrayBuffer?.byteLength)) || undefined;
    value.Value = ret; // Store the retrieved ArrayBuffer back into the value object
    return ret;
  });
}

export { createDataSource };
