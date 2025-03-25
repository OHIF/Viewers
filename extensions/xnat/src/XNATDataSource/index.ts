import { api } from 'dicomweb-client';
import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler, classes } from '@ohif/core';
import {
  mapParams,
  search as qidoSearch,
  seriesInStudy,
  processResults,
  processSeriesResults,
} from './qido.js';
import dcm4cheeReject from '../DicomWebDataSource/dcm4cheeReject.js';
import {getSOPClassUIDForModality} from './Utils/SOPUtils';
import getImageId from '../DicomWebDataSource/utils/getImageId.js';
import dcmjs from 'dcmjs';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from '../DicomWebDataSource/retrieveStudyMetadata.js';
import StaticWadoClient from '../DicomWebDataSource/utils/StaticWadoClient';
import getDirectURL from '../utils/getDirectURL';
import { fixBulkDataURI } from '../DicomWebDataSource/utils/fixBulkDataURI';
import { ensureInstanceRequiredFields } from './Utils/instanceUtils.js';
import { generateRandomUID, extractStudyUIDFromURL } from './Utils/UIDUtils';
const { DicomMetaDictionary, DicomDict } = dcmjs.data;
const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;
const metadataProvider = classes.MetadataProvider;

const ImplementationClassUID = '2.25.270695996825855179949881587723571202391.2.0.0';
const ImplementationVersionName = 'OHIF-VIEWER-XNAT-2.0.0';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

// Add a logging utility
const log = {
  debug: (message: string, ...args: any[]) => {
    console.debug(`XNAT: ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`XNAT: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`XNAT: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`XNAT: ${message}`, ...args);
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

export type XNATConfig = {
  /** Data source name */
  name: string;
  /** Base URL to use for QIDO requests */
  qidoRoot?: string;
  wadoRoot?: string;
  wadoUri?: string;
  qidoSupportsIncludeField?: boolean;
  imageRendering?: string;
  thumbnailRendering?: string;
  /** Whether the server supports reject calls */
  supportsReject?: boolean;
  /** Request series meta async instead of blocking */
  lazyLoadStudy?: boolean;
  /** Indicates if the retrieves can fetch singlepart. Options are bulkdata, video, image, or true */
  singlepart?: boolean | string;
  /** Transfer syntax to request from the server */
  requestTransferSyntaxUID?: string;
  acceptHeader?: string[];
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
  bulkDataURI?: {
    enabled?: boolean;
    startsWith?: string;
    prefixWith?: string;
    transform?: (uri: string) => string;
    relativeResolution?: 'studies' | 'series';
  };
  /** Function that is called after the configuration is initialized */
  onConfiguration: (config: XNATConfig, params) => XNATConfig;
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

/**
 * Creates an XNAT API based on the provided configuration.
 *
 * @param xnatConfig - Configuration for the XNAT API
 * @returns XNAT API object
 */
function createXNATApi(xnatConfig: XNATConfig, servicesManager) {
  const { userAuthenticationService } = servicesManager.services;
  let xnatConfigCopy, qidoConfig, wadoConfig, qidoDicomWebClient, wadoDicomWebClient;
  
  console.log('XNAT createXNATApi - Initializing');
  
  // Create basic configs and initialize clients immediately
  qidoConfig = {
    url: xnatConfig.qidoRoot,
    staticWado: xnatConfig.staticWado,
    singlepart: xnatConfig.singlepart,
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };
  
  wadoConfig = {
    url: xnatConfig.wadoRoot,
    staticWado: xnatConfig.staticWado,
    singlepart: xnatConfig.singlepart,
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };
  
  // Initialize clients right away
  try {
    console.log('Creating XNAT DICOMweb clients on module load');
    qidoDicomWebClient = xnatConfig.staticWado
      ? new StaticWadoClient(qidoConfig)
      : new api.DICOMwebClient(qidoConfig);
    
    wadoDicomWebClient = xnatConfig.staticWado
      ? new StaticWadoClient(wadoConfig)
      : new api.DICOMwebClient(wadoConfig);
  } catch (error) {
    console.error('Error initializing XNAT DICOMweb clients on module load:', error);
  }
  
  const generateWadoHeader = () => {
    console.log('XNAT generateWadoHeader');
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
  
  const getAuthorizationHeader = () => {
    console.log('XNAT getAuthorizationHeader');
    try {
      const xhrRequestHeaders: Record<string, string> = {};
      if (userAuthenticationService?.getAuthorizationHeader) {
        const authHeaders = userAuthenticationService.getAuthorizationHeader();
        if (authHeaders && authHeaders.Authorization) {
          xhrRequestHeaders.Authorization = authHeaders.Authorization;
        }
      }
      return xhrRequestHeaders;
    } catch (e) {
      console.warn('Error in getAuthorizationHeader:', e);
      return {};
    }
  };
  
  // Default to enabling bulk data retrieves
  xnatConfig.bulkDataURI ||= { enabled: true };
  console.log('xnatConfig', xnatConfig);
  
  // Helper function to access current xnatConfig inside implementation methods
  const getConfig = () => xnatConfig;
  
  const implementation = {
    initialize: ({ params, query }) => {
      console.log('XNAT XNATDataSource initialize called - refreshing clients');
      console.log('Initialize params:', params);
      console.log('Initialize query:', query);
      
      // Set up display set logging
      try {
        setupDisplaySetLogging();
        console.log('XNAT: Display set logging initialized');
      } catch (error) {
        console.error('XNAT: Error initializing display set logging:', error);
      }
      
      // Save XNAT-specific IDs from URL params or query
      xnatConfig.xnat = xnatConfig.xnat || {};
      
      // Extract XNAT-specific IDs from params or query
      const projectId = params?.projectId || query?.get('projectId');
      const experimentId = params?.experimentId || query?.get('experimentId');
      const sessionId = params?.sessionId || query?.get('sessionId');
      const subjectId = params?.subjectId || query?.get('subjectId');
      
      // Store in config for later use
      if (projectId) xnatConfig.xnat.projectId = projectId;
      if (experimentId) xnatConfig.xnat.experimentId = experimentId;
      if (sessionId) xnatConfig.xnat.sessionId = sessionId;
      if (subjectId) xnatConfig.xnat.subjectId = subjectId;
      
      console.log('XNAT IDs extracted:', { 
        projectId: xnatConfig.xnat.projectId,
        experimentId: xnatConfig.xnat.experimentId,
        sessionId: xnatConfig.xnat.sessionId,
        subjectId: xnatConfig.xnat.subjectId
      });
      
      if (xnatConfig.onConfiguration && typeof xnatConfig.onConfiguration === 'function') {
        xnatConfig = xnatConfig.onConfiguration(xnatConfig, {
          params,
          query,
        });
      }

      xnatConfigCopy = JSON.parse(JSON.stringify(xnatConfig));
      console.log('xnatConfigCopy', xnatConfigCopy);

      qidoConfig = {
        url: xnatConfig.qidoRoot,
        staticWado: xnatConfig.staticWado,
        singlepart: xnatConfig.singlepart,
        headers: userAuthenticationService?.getAuthorizationHeader
        ? userAuthenticationService.getAuthorizationHeader()
        : undefined,
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
      };
      
      wadoConfig = {
        url: xnatConfig.wadoRoot,
        staticWado: xnatConfig.staticWado,
        singlepart: xnatConfig.singlepart,
        headers: userAuthenticationService?.getAuthorizationHeader
        ? userAuthenticationService.getAuthorizationHeader()
        : undefined,        
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
      };
      
      // Refresh the DICOM web clients
      console.log('Initializing XNAT DICOMweb clients');
      try {
        qidoDicomWebClient = xnatConfig.staticWado
          ? new StaticWadoClient(qidoConfig)
          : new api.DICOMwebClient(qidoConfig);
        console.log('XNAT qidoDicomWebClient', qidoDicomWebClient);
      } catch (error) {
        console.error('Error initializing XNAT qido DICOMweb clients:', error);
      }

      try {
        wadoDicomWebClient = xnatConfig.staticWado
          ? new StaticWadoClient(wadoConfig)
          : new api.DICOMwebClient(wadoConfig);
        console.log('XNAT wadoDicomWebClient', wadoDicomWebClient);
      } catch (error) {
        console.error('Error initializing XNAT wado DICOMweb clients:', error);
      }
    },
    
    query: {
      studies: {
        mapParams: mapParams.bind({}),
        search: async function (origParams) {
          console.log('XNAT qidosearch');
          console.log('XNAT: search: original params', origParams);
          
          // Extract study instance UID from params
          let studyInstanceUid = origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
          console.log('XNAT: search: studyInstanceUid from params', studyInstanceUid);
          
          // If no studyInstanceUid directly provided, check if it's in a nested object
          if (!studyInstanceUid && typeof origParams === 'object' && origParams !== null) {
            if (origParams.studyInstanceUid) {
              studyInstanceUid = origParams.studyInstanceUid;
            }
          }
          
          // Extract XNAT identifiers from configuration 
          let projectId = xnatConfig.xnat?.projectId;
          let experimentId = xnatConfig.xnat?.experimentId || xnatConfig.xnat?.sessionId;
          
          // If we don't have project and experiment IDs in config, try to derive them
          if (!projectId || !experimentId) {
            console.log('XNAT: Trying to derive project and experiment IDs from URL or study UID');
            
            // Check URL for study or experiment ID parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            // Look for alternative parameter names in URL
            const possibleProjectParams = ['projectId', 'project', 'proj'];
            const possibleExperimentParams = ['experimentId', 'experiment', 'session', 'exam', 'scan'];
            
            for (const param of possibleProjectParams) {
              const value = urlParams.get(param);
              if (value) {
                projectId = value;
                console.log(`XNAT: Found project ID in URL parameter '${param}': ${projectId}`);
                break;
              }
            }
            
            for (const param of possibleExperimentParams) {
              const value = urlParams.get(param);
              if (value) {
                experimentId = value;
                console.log(`XNAT: Found experiment ID in URL parameter '${param}': ${experimentId}`);
                break;
              }
            }
            
            // If we still don't have project/experiment IDs, try to derive from StudyInstanceUID
            if ((!projectId || !experimentId) && studyInstanceUid) {
              console.log('XNAT: Attempting to derive project/experiment from StudyInstanceUID:', studyInstanceUid);
              
              if (!experimentId) {
                experimentId = studyInstanceUid;
                console.log('XNAT: Using StudyInstanceUID as experimentId:', experimentId);
              }
              
              if (!projectId) {
                projectId = "defaultProject";
                console.log('XNAT: Using default project ID:', projectId);
              }
            }
          }
          
          console.log('XNAT study search using:', { projectId, experimentId, studyInstanceUid });
          
          if (!projectId || !experimentId) {
            console.error('XNAT: Missing projectId or experimentId for metadata fetch in search');
            console.error('XNAT: Please provide these values in URL parameters or configuration');
            return [];
          }
          
          try {
            // Use the XNAT-specific method to get experiment metadata instead of DICOMweb QIDO
            console.log('XNAT: Using direct XNAT API call instead of DICOMweb QIDO search');
            const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
            
            if (!xnatMetadata || !xnatMetadata.studies || !xnatMetadata.studies.length) {
              console.error('XNAT: No valid metadata returned from XNAT API in search');
              return [];
            }
            
            // Convert XNAT metadata format to QIDO-RS format that the viewer expects
            const results = [];
            
            xnatMetadata.studies.forEach(study => {
              // Create a result object in QIDO-RS format
              const result = {
                "00080020": { vr: "DA", Value: [study.StudyDate || ""] },
                "00080030": { vr: "TM", Value: [study.StudyTime || ""] },
                "00080050": { vr: "SH", Value: [study.AccessionNumber || ""] },
                "00080054": { vr: "AE", Value: [xnatConfig.qidoRoot || ""] },
                "00080056": { vr: "CS", Value: ["ONLINE"] },
                "00080061": { vr: "CS", Value: study.Modalities ? study.Modalities.split("\\") : [""] },
                "00080090": { vr: "PN", Value: [{ Alphabetic: study.ReferringPhysicianName || "" }] },
                "00081190": { vr: "UR", Value: [xnatConfig.qidoRoot || ""] },
                "00100010": { vr: "PN", Value: [{ Alphabetic: study.PatientName || "Anonymous" }] },
                "00100020": { vr: "LO", Value: [study.PatientID || ""] },
                "00100030": { vr: "DA", Value: [study.PatientBirthDate || ""] },
                "00100040": { vr: "CS", Value: [study.PatientSex || ""] },
                "0020000D": { vr: "UI", Value: [studyInstanceUid || study.StudyInstanceUID || xnatMetadata.transactionId] },
                "00200010": { vr: "SH", Value: [study.StudyID || ""] },
                "00081030": { vr: "LO", Value: [study.StudyDescription || "XNAT Study"] }
              };
              
              // Add series count
              if (study.series && study.series.length) {
                result["00201206"] = { vr: "IS", Value: [study.series.length.toString()] };
                
                // Get modalities from series
                const modalities = new Set();
                study.series.forEach(series => {
                  if (series.Modality) {
                    modalities.add(series.Modality);
                  }
                });
                
                if (modalities.size > 0) {
                  result["00080061"].Value = Array.from(modalities);
                }
              }
              
              results.push(result);
            });
            
            console.log('XNAT: Processed query results from XNAT API', results);
            return results;
          } catch (error) {
            console.error('XNAT: Error in study search:', error);
            
            // Fall back to traditional DICOMweb search as a last resort
            console.warn('XNAT: Falling back to DICOMweb search (likely to fail if XNAT does not support DICOMweb)');
            
            // Check client exists
            if (!qidoDicomWebClient) {
              console.error('qidoDicomWebClient not available - search may fail');
              return [];
            }
            
            qidoDicomWebClient.headers = getAuthorizationHeader();
            
            // Fix for StudyInstanceUID case differences
            if (origParams?.StudyInstanceUID && !origParams?.studyInstanceUID) {
              origParams.studyInstanceUID = origParams.StudyInstanceUID;
            }
            
            console.log('XNAT: search: after normalization', origParams);
            
            const mappedParams = mapParams(origParams, {
              supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
              supportsWildcard: xnatConfig.supportsWildcard,
            }) || {};
            
            // Extract study and series UIDs separately to avoid destructuring issues
            const studyInstanceUid = mappedParams.studyInstanceUID || origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
            const seriesInstanceUid = mappedParams.seriesInstanceUID;
            
            // Remove these properties to prevent duplicate parameters
            delete mappedParams.studyInstanceUID;
            delete mappedParams.seriesInstanceUID;
            
            console.log('XNAT: search: studyInstanceUid', studyInstanceUid);
            console.log('XNAT: search: seriesInstanceUid', seriesInstanceUid);
            console.log('XNAT: search: queryParameters', mappedParams);

            const results = await qidoSearch(qidoDicomWebClient, studyInstanceUid, seriesInstanceUid, mappedParams);
            console.log('XNAT: search: results', results);
            return processResults(results);
          }
        },
      },
      
      series: {
        search: async function (studyInstanceUid, filters) {
          console.log('XNAT series search');
          console.log('XNAT series search: studyInstanceUid', studyInstanceUid);
          console.log('XNAT series search: filters', filters);
          
          if (!qidoDicomWebClient) {
            console.error('qidoDicomWebClient not available - series search may fail');
            return [];
          }
          qidoDicomWebClient.headers = getAuthorizationHeader();
          
          // Ensure studyInstanceUid is a string
          if (typeof studyInstanceUid !== 'string') {
            console.warn('XNAT series search: studyInstanceUid is not a string', studyInstanceUid);
            if (studyInstanceUid?.StudyInstanceUID) {
              studyInstanceUid = studyInstanceUid.StudyInstanceUID;
            } else if (studyInstanceUid?.studyInstanceUID) {
              studyInstanceUid = studyInstanceUid.studyInstanceUID;
            } else {
              console.error('XNAT series search: Unable to determine studyInstanceUid');
              return [];
            }
          }
          
          const mappedFilters = mapParams(filters, {
            supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
            supportsWildcard: xnatConfig.supportsWildcard,
          });
          
          console.log('XNAT series search: using studyInstanceUid', studyInstanceUid);
          console.log('XNAT series search: mapped filters', mappedFilters);
          
          try {
            // Call seriesInStudy with the correct number of arguments
            // The seriesInStudy function expects (client, studyInstanceUid) params
            const results = await seriesInStudy(qidoDicomWebClient, studyInstanceUid);
            console.log('XNAT series search: results', results);
            return processSeriesResults(results);
          } catch (error) {
            console.error('XNAT series search error:', error);
            return [];
          }
        },
      },
      
      instances: {
        search: async function (studyInstanceUid, querySeriesInsances, filters) {
          console.log('XNAT instances search');
          if (!qidoDicomWebClient) {
            console.error('qidoDicomWebClient not available - instances search may fail');
            return [];
          }
          qidoDicomWebClient.headers = getAuthorizationHeader();
          
          const mappedFilters = mapParams(filters, {
            supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
            supportsWildcard: xnatConfig.supportsWildcard,
          });
          
          const instances = await qidoDicomWebClient.searchForInstances({
            studyInstanceUID: studyInstanceUid,
            seriesInstanceUID: querySeriesInsances,
            queryParams: mappedFilters,
          });
          
          return instances;
        },
      },
    },
    
    retrieve: {
      bulkDataURI: function(value, instance) {
        // Only call fixBulkDataURI if we have a valid config with bulkDataURI settings
        if (xnatConfig && value && instance) {
          return fixBulkDataURI(value, instance, xnatConfig);
        }
      },
      
      series: {
        metadata: async function (
          {
            StudyInstanceUID,
            SeriesInstanceUID,
            returnPromises = false,
            filters,
            sortCriteria
          }: {
            StudyInstanceUID: string;
            SeriesInstanceUID?: string;
            returnPromises?: boolean;
            filters?: Record<string, unknown> | Array<Record<string, unknown>>;
            sortCriteria?: any;
          },
        ): Promise<any> {
          // Import the DeferredPromise utilities
          const { wrapArrayWithDeferredPromises } = await import('../utils/DeferredPromise');

          log.info('XNAT: retrieve.series.metadata', {
            StudyInstanceUID,
            SeriesInstanceUID,
            returnPromises,
            filters,
          });

          try {
            // Check if StudyInstanceUID is undefined or empty
            if (!StudyInstanceUID) {
              log.warn('XNAT: No StudyInstanceUID provided - trying to find one from configuration or URL');
              
              // Try to extract from URL parameters first
              const urlParams = new URLSearchParams(window.location.search);
              const studyParam = urlParams.get('StudyInstanceUID') || urlParams.get('studyInstanceUID');
              
              if (studyParam) {
                log.info(`XNAT: Found StudyInstanceUID in URL: ${studyParam}`);
                StudyInstanceUID = studyParam;
              } else if (sessionStorage.getItem('lastSelectedStudyInstanceUID')) {
                // Try to get the last selected study from sessionStorage
                StudyInstanceUID = sessionStorage.getItem('lastSelectedStudyInstanceUID');
                log.info(`XNAT: Using last selected StudyInstanceUID from sessionStorage: ${StudyInstanceUID}`);
              } else {
                // Try to get study from XNAT configuration
                if (xnatConfig.xnat?.experimentId) {
                  log.info(`XNAT: Using experimentId as StudyInstanceUID: ${xnatConfig.xnat.experimentId}`);
                  StudyInstanceUID = xnatConfig.xnat.experimentId;
                } else {
                  throw new Error('No StudyInstanceUID provided and cannot determine one from context');
                }
              }
            }

            // Extract XNAT identifiers from config
            const xnatData = getXNATStatusFromStudyInstanceUID(StudyInstanceUID, xnatConfig);
            const { projectId, experimentId } = xnatData;

            if (!projectId || !experimentId) {
              throw new Error(`Failed to extract XNAT identifiers from StudyInstanceUID: ${StudyInstanceUID}`);
            }

            log.debug('XNAT: Getting series metadata for', {
              projectId,
              experimentId,
              SeriesInstanceUID,
            });

            // Fetch all instances for the series (or all series if SeriesInstanceUID not provided)
            const seriesData = await getSeriesXNATInstancesMetadata({
              projectId,
              experimentId,
              seriesUID: SeriesInstanceUID,
              implementation,
            });

            if (!seriesData || !seriesData.length) {
              throw new Error(
                `No series data found for study ${StudyInstanceUID} ${
                  SeriesInstanceUID ? `and series ${SeriesInstanceUID}` : ''
                }`
              );
            }
            
            // Filter series data if SeriesInstanceUID is provided
            const filteredSeriesData = SeriesInstanceUID
              ? seriesData.filter(series => 
                  series.SeriesInstanceUID === SeriesInstanceUID)
              : seriesData;

            if (filteredSeriesData.length === 0) {
              throw new Error(
                `No series data found matching SeriesInstanceUID ${SeriesInstanceUID} in study ${StudyInstanceUID}`
              );
            }

            // Handle returnPromises option (used by the defaultRouteInit function)
            if (returnPromises) {
              console.log('XNAT: Returning promises for lazy loading');
              
              // Create an array of functions that return promises
              const seriesPromiseFunctions = filteredSeriesData.map(series => {
                return () => {
                  return Promise.resolve().then(() => {
                    if (series.instances && series.instances.length > 0) {
                      // Process all instances in this series and collect them in an array
                      const processedInstances = [];
                      
                      series.instances.forEach(instance => {
                        // Use the URL directly from the instance object instead of trying to construct it
                        let instanceURLPath;
                        
                        if (instance.url) {
                          instanceURLPath = instance.url;
                        } else if (instance.scanId && instance.name) {
                          instanceURLPath = `/data/experiments/${encodeURIComponent(experimentId)}/scans/${encodeURIComponent(instance.scanId)}/resources/DICOM/files/${encodeURIComponent(instance.name)}`;
                        } else {
                          console.error("XNAT: Unable to determine instance URL", instance);
                          return; // Skip this instance
                        }
                        
                        // Make sure we're getting a proper absolute URL
                        const baseUrl = xnatConfig.wadoRoot || window.location.origin;
                        const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                        
                        // Set URL and imageId
                        instance.url = absoluteUrl;
                        instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                        
                        // Critical for MPR - FORCE these to be true for each instance
                        instance.isReconstructable = true;
                        instance.isMultiFrame = false;
                        
                        // Instead of adding to DicomMetadataStore now, collect all instances first
                        processedInstances.push(instance);
                      });
                      console.log('Processed Instances', processedInstances);
                      // Add all instances at once in a batch
                      if (processedInstances.length > 0 && (!filters || !(filters as any).batch)) {
                        // Make sure every instance has proper StudyInstanceUID and SeriesInstanceUID
                        processedInstances.forEach(instance => {
                          instance.StudyInstanceUID = instance.StudyInstanceUID || series.StudyInstanceUID;
                          instance.SeriesInstanceUID = instance.SeriesInstanceUID || series.SeriesInstanceUID;
                          
                          // Make sure SOPInstanceUID is always defined
                          if (!instance.SOPInstanceUID) {
                            // First check if it's in the metadata
                            if (instance.metadata && instance.metadata.SOPInstanceUID) {
                              instance.SOPInstanceUID = instance.metadata.SOPInstanceUID;
                              console.log('XNAT: Using SOPInstanceUID from metadata:', instance.SOPInstanceUID);
                            } else {
                              // Only generate as a last resort
                              instance.SOPInstanceUID = generateRandomUID();
                              console.log('XNAT: Generated new SOPInstanceUID:', instance.SOPInstanceUID);
                            }
                          }
                          
                          // Make sure SOPClassUID is set - critical for display sets
                          if (!instance.SOPClassUID) {
                            // Check metadata first
                            if (instance.metadata && instance.metadata.SOPClassUID) {
                              instance.SOPClassUID = instance.metadata.SOPClassUID;
                              console.log('XNAT: Using SOPClassUID from metadata:', instance.SOPClassUID);
                            } else {
                              // Set appropriate SOP Class based on modality if available
                              if (series.Modality === 'MR') {
                                instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.4'; // MR Image Storage
                              } else if (series.Modality === 'CT') {
                                instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.2'; // CT Image Storage
                              } else if (series.Modality === 'PT') {
                                instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.128'; // PET Image Storage
                              } else {
                                // Default to CT Image Storage as fallback
                                instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.2';
                              }
                              console.log('XNAT: Using modality-based SOPClassUID:', instance.SOPClassUID);
                            }
                          }
                          
                          if (instance.metadata) {
                            instance.metadata.StudyInstanceUID = instance.metadata.StudyInstanceUID || series.StudyInstanceUID;
                            instance.metadata.SeriesInstanceUID = instance.metadata.SeriesInstanceUID || series.SeriesInstanceUID;
                            // If instance has SOPInstanceUID but metadata doesn't, copy it to metadata
                            if (instance.SOPInstanceUID && !instance.metadata.SOPInstanceUID) {
                              instance.metadata.SOPInstanceUID = instance.SOPInstanceUID;
                            }
                            // If instance has SOPClassUID but metadata doesn't, copy it to metadata
                            if (instance.SOPClassUID && !instance.metadata.SOPClassUID) {
                              instance.metadata.SOPClassUID = instance.SOPClassUID;
                            }
                          }
                          

                        });
                        
                        log.info(`XNAT: Adding ${processedInstances.length} instances in batch for series ${series.SeriesInstanceUID} of study ${series.StudyInstanceUID}`);
                        DicomMetadataStore.addInstances(processedInstances, true);
                        
                        // Simple log with instance data
                        console.log('XNAT: Processed instances added to DicomMetadataStore');
                        console.log('766 First instance sample:', {
                          StudyInstanceUID: processedInstances[0].StudyInstanceUID,
                          SeriesInstanceUID: processedInstances[0].SeriesInstanceUID,
                          SOPInstanceUID: processedInstances[0].SOPInstanceUID,
                          imageId: processedInstances[0].imageId,
                          url: processedInstances[0].url,
                          metadata: processedInstances[0].metadata ? 'present' : 'missing',
                          displaySetInstanceUID: processedInstances[0].displaySetInstanceUID
                        });
                      }
                    }
                    
                    // Return the processed series
                    return [series];
                  });
                };
              });
              
              // Wrap the promise functions with DeferredPromise to ensure they have start() method
              return wrapArrayWithDeferredPromises(seriesPromiseFunctions);
            }

            // Process each series (normal non-promise path)
            return filteredSeriesData.map(series => {
              // Mark this series and all its instances as reconstructable for MPR view
              series.isReconstructable = true;
              series.isMultiFrame = false;
              
              if (series.instances && series.instances.length > 0) {
                // Process all instances in this series and collect them in an array
                const processedInstances = [];
                
                series.instances.forEach(instance => {
                  // FORCE these to be true for each instance
                  instance.isReconstructable = true;
                  instance.isMultiFrame = false;
                  
                  // Also set them in the metadata
                  if (instance.metadata) {
                    instance.metadata.isReconstructable = true;
                    instance.metadata.isMultiFrame = false;
                  }
                  
                  // We no longer set displaySetInstanceUID here - let the ImageSet class handle this during display set creation
                  /*
                  // Make sure displaySetInstanceUID is consistent with the series
                  if (series.displaySetInstanceUID && (!instance.displaySetInstanceUID || instance.displaySetInstanceUID !== series.displaySetInstanceUID)) {
                    instance.displaySetInstanceUID = series.displaySetInstanceUID;
                    log.info(`XNAT: Setting instance displaySetInstanceUID to match series: ${series.displaySetInstanceUID}`);
                    
                    // Also set it in the metadata
                    if (instance.metadata) {
                      instance.metadata.displaySetInstanceUID = series.displaySetInstanceUID;
                    }
                  }
                  */
                  
                  // Use the URL directly from the instance object instead of trying to construct it
                  let instanceURLPath;
                  
                  if (instance.url) {
                    instanceURLPath = instance.url;
                  } else if (instance.scanId && instance.name) {
                    instanceURLPath = `/data/experiments/${encodeURIComponent(experimentId)}/scans/${encodeURIComponent(instance.scanId)}/resources/DICOM/files/${encodeURIComponent(instance.name)}`;
                  } else {
                    console.error("XNAT: Unable to determine instance URL", instance);
                    return; // Skip this instance
                  }
                  
                  // Make sure we're getting a proper absolute URL
                  const baseUrl = xnatConfig.wadoRoot || window.location.origin;
                  const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                  
                  // Set URL and imageId
                  instance.url = absoluteUrl;
                  instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                  
                  // Instead of adding to DicomMetadataStore one by one, collect all instances first
                  processedInstances.push(instance);
                });
                
                // Add all instances at once in a batch
                if (processedInstances.length > 0 && (!filters || !(filters as any).batch)) {
                  // Make sure every instance has proper StudyInstanceUID and SeriesInstanceUID
                  processedInstances.forEach(instance => {
                    instance.StudyInstanceUID = instance.StudyInstanceUID || series.StudyInstanceUID;
                    instance.SeriesInstanceUID = instance.SeriesInstanceUID || series.SeriesInstanceUID;
                    
                    // Make sure SOPInstanceUID is always defined
                    if (!instance.SOPInstanceUID) {
                      // First check if it's in the metadata
                      if (instance.metadata && instance.metadata.SOPInstanceUID) {
                        instance.SOPInstanceUID = instance.metadata.SOPInstanceUID;
                        console.log('XNAT: Using SOPInstanceUID from metadata:', instance.SOPInstanceUID);
                      } else {
                        // Only generate as a last resort
                        instance.SOPInstanceUID = generateRandomUID();
                        console.log('XNAT: Generated new SOPInstanceUID:', instance.SOPInstanceUID);
                      }
                    }
                    
                    // Make sure SOPClassUID is set - critical for display sets
                    if (!instance.SOPClassUID) {
                      // Check metadata first
                      if (instance.metadata && instance.metadata.SOPClassUID) {
                        instance.SOPClassUID = instance.metadata.SOPClassUID;
                        console.log('XNAT: Using SOPClassUID from metadata:', instance.SOPClassUID);
                      } else {
                        // Set appropriate SOP Class based on modality if available
                        if (series.Modality === 'MR') {
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.4'; // MR Image Storage
                        } else if (series.Modality === 'CT') {
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.2'; // CT Image Storage
                        } else if (series.Modality === 'PT') {
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.128'; // PET Image Storage
                        } else {
                          // Default to CT Image Storage as fallback
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.2';
                        }
                        console.log('XNAT: Using modality-based SOPClassUID:', instance.SOPClassUID);
                      }
                    }
                    
                    if (instance.metadata) {
                      instance.metadata.StudyInstanceUID = instance.metadata.StudyInstanceUID || series.StudyInstanceUID;
                      instance.metadata.SeriesInstanceUID = instance.metadata.SeriesInstanceUID || series.SeriesInstanceUID;
                      // If instance has SOPInstanceUID but metadata doesn't, copy it to metadata
                      if (instance.SOPInstanceUID && !instance.metadata.SOPInstanceUID) {
                        instance.metadata.SOPInstanceUID = instance.SOPInstanceUID;
                      }
                      // If instance has SOPClassUID but metadata doesn't, copy it to metadata
                      if (instance.SOPClassUID && !instance.metadata.SOPClassUID) {
                        instance.metadata.SOPClassUID = instance.SOPClassUID;
                      }
                    }
                  });
                  
                  log.info(`XNAT: Adding ${processedInstances.length} instances in batch for series ${series.SeriesInstanceUID} of study ${series.StudyInstanceUID}`);
                  DicomMetadataStore.addInstances(processedInstances, true);
                  
                  // Simple log with instance data
                  console.log('XNAT: Processed instances added to DicomMetadataStore');
                  console.log('811 First instance sample:', {
                    StudyInstanceUID: processedInstances[0].StudyInstanceUID,
                    SeriesInstanceUID: processedInstances[0].SeriesInstanceUID,
                    SOPInstanceUID: processedInstances[0].SOPInstanceUID,
                    imageId: processedInstances[0].imageId,
                    url: processedInstances[0].url,
                    metadata: processedInstances[0].metadata ? 'present' : 'missing',
                    displaySetInstanceUID: processedInstances[0].displaySetInstanceUID
                  });
                }
              }
              
              return series;
            });
          } catch (error) {
            log.error('XNAT: Error in retrieve.series.metadata:', error);
            throw error;
          }
        },
      },
      
      study: {
        metadata: async function (studyInstanceUID, options = {}) {
          console.log('XNAT retrieve study metadata', {studyInstanceUID});
          
          // Add diagnostic logs to help debug the call context
          log.info('XNAT: study.metadata called with:', {
            studyInstanceUID,
            options,
            stack: new Error().stack,
            config: xnatConfig,
            timestamp: new Date().toISOString()
          });
          
          // Handle studyInstanceUID when it's an object (common case)
          let studyUid = studyInstanceUID;
          if (typeof studyInstanceUID === 'object' && studyInstanceUID !== null) {
            if (studyInstanceUID.StudyInstanceUID) {
              studyUid = studyInstanceUID.StudyInstanceUID;
              console.log('XNAT: Extracted StudyInstanceUID from object:', studyUid);
            } else {
              console.error('XNAT: studyInstanceUID is an object but missing StudyInstanceUID property');
              return null;
            }
          }
          
          // Extract XNAT identifiers from configuration 
          let projectId = xnatConfig.xnat?.projectId;
          let experimentId = xnatConfig.xnat?.experimentId || xnatConfig.xnat?.sessionId;
          
          // If we don't have project and experiment IDs in config, try to derive them
          if (!projectId || !experimentId) {
            console.log('XNAT: Trying to derive project and experiment IDs from URL or study UID');
            
            // Check URL for study or experiment ID parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            // Look for alternative parameter names in URL
            const possibleProjectParams = ['projectId', 'project', 'proj'];
            const possibleExperimentParams = ['experimentId', 'experiment', 'session', 'exam', 'scan'];
            
            for (const param of possibleProjectParams) {
              const value = urlParams.get(param);
              if (value) {
                projectId = value;
                console.log(`XNAT: Found project ID in URL parameter '${param}': ${projectId}`);
                break;
              }
            }
            
            for (const param of possibleExperimentParams) {
              const value = urlParams.get(param);
              if (value) {
                experimentId = value;
                console.log(`XNAT: Found experiment ID in URL parameter '${param}': ${experimentId}`);
                break;
              }
            }
            
            // If we still don't have project/experiment IDs, try to derive from StudyInstanceUID
            if ((!projectId || !experimentId) && studyUid) {
              console.log('XNAT: Attempting to derive project/experiment from StudyInstanceUID:', studyUid);
              
              if (!experimentId) {
                experimentId = studyUid;
                console.log('XNAT: Using StudyInstanceUID as experimentId:', experimentId);
              }
              
              if (!projectId) {
                projectId = "defaultProject";
                console.log('XNAT: Using default project ID:', projectId);
              }
            }
          }
          
          console.log('XNAT study metadata retrieval using:', { projectId, experimentId, studyUid });
          
          if (!projectId || !experimentId) {
            console.error('XNAT: Missing projectId or experimentId for metadata fetch');
            console.error('XNAT: Please provide these values in URL parameters or configuration');
            return null;
          }
          
          try {
            // Use the XNAT-specific method to get experiment metadata
            const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
            
            if (!xnatMetadata) {
              console.error('XNAT: No metadata returned from XNAT API');
              return null;
            }
            
            console.log('XNAT: Successfully retrieved study metadata from XNAT API');
            
            // Get the base URL for constructing absolute URLs
            let baseUrl = '';
            try {
              if (typeof xnatConfig.wadoRoot === 'string' && xnatConfig.wadoRoot) {
                const url = new URL(xnatConfig.wadoRoot);
                baseUrl = `${url.protocol}//${url.host}`;
              } else {
                // Fallback to window location
                baseUrl = `${window.location.protocol}//${window.location.host}`;
              }
            } catch (error) {
              console.error('XNAT: Error parsing URL, using window location', error);
              baseUrl = `${window.location.protocol}//${window.location.host}`;
              console.log('XNAT: Using window location as base URL for image loading:', baseUrl);
            }
            console.log('XNAT: Using base URL for image loading:', baseUrl);
            
            // Process instance metadata to make it compatible with the viewer's expectations
            const processedStudy = {
              studyInstanceUID: studyUid,
              transactionId: xnatMetadata.transactionId,
              series: [],
              seriesMap: new Map(),
              instances: [],
              metadata: xnatMetadata,
            };
            
            // XNAT API returns data in a specific structure we need to process
            if (xnatMetadata.studies && xnatMetadata.studies.length > 0) {
              // Group instances by SeriesInstanceUID for proper batching
              const seriesInstancesMap = new Map();
              
              xnatMetadata.studies.forEach(study => {
                if (study.series && study.series.length > 0) {
                  study.series.forEach((series, index) => {
                    // We no longer generate displaySetInstanceUID here
                    // Let the ImageSet class handle this during display set creation
                            
                    // Make sure each series has critical properties needed for proper grouping
                    const enhancedSeries = {
                      ...series,
                      Modality: series.Modality || 'CT',
                      SeriesDescription: series.SeriesDescription || 'XNAT Series',
                      SeriesNumber: series.SeriesNumber || '1',
                      SeriesDate: series.SeriesDate || study.StudyDate || '',
                      SeriesTime: series.SeriesTime || study.StudyTime || '',
                      // Critical for display set creation
                      isMultiFrame: false,
                      isReconstructable: true,
                      StudyInstanceUID: studyUid
                      // We no longer set displaySetInstanceUID here
                    };
                    
                    processedStudy.series.push(enhancedSeries);
                    processedStudy.seriesMap.set(series.SeriesInstanceUID, enhancedSeries);
                    
                    // Initialize an array for this series in our map if needed
                    if (!seriesInstancesMap.has(series.SeriesInstanceUID)) {
                      seriesInstancesMap.set(series.SeriesInstanceUID, []);
                    }
                    
                    if (series.instances && series.instances.length > 0) {
                      // Sort instances numerically by instance number if available
                      const sortedInstances = [...series.instances].sort((a, b) => {
                        const aNum = parseInt(a.metadata?.InstanceNumber || '0');
                        const bNum = parseInt(b.metadata?.InstanceNumber || '0');
                        return aNum - bNum;
                      });
                      
                      // Process instances and collect them by series
                      const seriesProcessedInstances = [];
                      
                      sortedInstances.forEach((instance, index) => {
                        // Ensure the url is handled correctly
                        let instanceURLPath;
                        if (instance.url) {
                          // Use the URL directly from the XNAT API response
                          log.debug("XNAT: Using URL from instance:", instance.url);
                          instanceURLPath = instance.url;
                        } else if (instance.scanId && instance.name) {
                          // Fallback to constructing URL if scanId and name are available
                          instanceURLPath = `/data/experiments/${encodeURIComponent(experimentId)}/scans/${encodeURIComponent(instance.scanId)}/resources/DICOM/files/${encodeURIComponent(instance.name)}`;
                          log.debug("XNAT: Constructed URL from parts:", instanceURLPath);
                        } else {
                          // Log error if we can't get a valid URL
                          log.error("XNAT: Unable to determine instance URL", instance);
                          return; // Skip this instance
                        }
                        
                        // Make sure we're getting a proper absolute URL based on the configuration
                        const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                        
                        // Create properly formatted imageId for Cornerstone using our helper function
                        instance.url = absoluteUrl;
                        instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                        
                        // If metadata doesn't exist, create it
                        if (!instance.metadata) {
                          instance.metadata = {};
                        }
                        
                        // Create enhanced instance metadata for this instance
                        const instanceMetadata = {
                          ...series,
                          ...instance.metadata,
                          url: absoluteUrl,
                          StudyInstanceUID: studyUid,
                          SeriesInstanceUID: series.SeriesInstanceUID,
                          // Add the proper imageId for Cornerstone
                          imageId: instance.imageId,
                          // Add important tags for Cornerstone to use
                          Rows: instance.metadata?.Rows || 512,
                          Columns: instance.metadata?.Columns || 512,
                          // Instance Number with fallback - make it ordinal if not available
                          InstanceNumber: instance.metadata?.InstanceNumber || (index + 1).toString(),
                          // Use SOPInstanceUID from metadata if available, otherwise generate one
                          SOPInstanceUID: instance.metadata?.SOPInstanceUID || instance.SOPInstanceUID || generateRandomUID(),
                          // Set SOPClassUID based on modality - critical for display set creation
                          SOPClassUID: instance.metadata?.SOPClassUID || (() => {
                            if (series.Modality === 'MR') {
                              return '1.2.840.10008.5.1.4.1.1.4'; // MR Image Storage
                            } else if (series.Modality === 'CT') {
                              return '1.2.840.10008.5.1.4.1.1.2'; // CT Image Storage
                            } else if (series.Modality === 'PT') {
                              return '1.2.840.10008.5.1.4.1.1.128'; // PET Image Storage
                            } else if (series.Modality === 'US') {
                              return '1.2.840.10008.5.1.4.1.1.6.1'; // Ultrasound Image Storage
                            } else if (series.Modality === 'CR' || series.Modality === 'DX') {
                              return '1.2.840.10008.5.1.4.1.1.1.1'; // Digital X-Ray Image Storage
                            } else {
                              return '1.2.840.10008.5.1.4.1.1.2'; // Default to CT Image Storage
                            }
                          })(),
                          // Add spatial information for MPR reconstruction
                          ImagePositionPatient: instance.metadata?.ImagePositionPatient || [0, 0, index], // Use index for z position if not available
                          ImageOrientationPatient: instance.metadata?.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
                          PixelSpacing: instance.metadata?.PixelSpacing || [1, 1],
                          SliceThickness: instance.metadata?.SliceThickness || 1,
                          SliceLocation: instance.metadata?.SliceLocation || index,
                          // Add frame of reference UID for linking
                          FrameOfReferenceUID: instance.metadata?.FrameOfReferenceUID || series.FrameOfReferenceUID || generateRandomUID(),
                          // Add custom XNAT properties for debugging
                          xnatProjectId: projectId,
                          xnatExperimentId: experimentId,
                          // Make sure correct modality is set
                          Modality: series.Modality || 'CT',
                          // Force MPR reconstruction flags
                          isReconstructable: true,
                          isMultiFrame: false
                        };
                        
                        // Add processed instance to the array for this series
                        seriesProcessedInstances.push(instanceMetadata);
                        
                        // Also add to the overall study instances
                        processedStudy.instances.push(instanceMetadata);
                        
                        // Make sure SOPClassUID is set based on modality - critical for proper display set creation
                        if (series.Modality === 'MR') {
                          // Use MR SOP Class for MR images
                          instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.4';
                        } else if (series.Modality === 'CT') {
                          // Use CT SOP Class for CT images
                          instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.2';
                        } else if (series.Modality === 'PT') {
                          // Positron Emission Tomography Image Storage
                          instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.128';
                        } else if (series.Modality === 'US') {
                          // Ultrasound Image Storage
                          instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.6.1';
                        } else if (series.Modality === 'CR' || series.Modality === 'DX') {
                          // Digital X-Ray Image Storage
                          instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.1.1';
                        } else {
                          // Default to CT as fallback
                          instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.2';
                        }
                        
                        // Make sure SOPClassUID is in metadata too
                        if (instanceMetadata.metadata) {
                          instanceMetadata.metadata.SOPClassUID = instanceMetadata.metadata.SOPClassUID || instanceMetadata.SOPClassUID;
                        }
                      });
                      
                      // Store processed instances for this series in the series object
                      enhancedSeries.instances = seriesProcessedInstances;
                      
                      // Add all instances for this series to the map for batched processing
                      if (seriesProcessedInstances.length > 0) {
                        const existingInstances = seriesInstancesMap.get(series.SeriesInstanceUID) || [];
                        seriesInstancesMap.set(series.SeriesInstanceUID, [...existingInstances, ...seriesProcessedInstances]);
                      }
                    }
                  });
                }
              });
              
              // Now add instances by series in batches
              for (const [seriesUID, instances] of seriesInstancesMap.entries()) {
                if (instances.length > 0) {
                  // Make sure every instance has the required study and series UIDs before adding to DicomMetadataStore
                  instances.forEach(instance => {
                    // Ensure StudyInstanceUID is set
                    instance.StudyInstanceUID = instance.StudyInstanceUID || studyUid;
                    instance.SeriesInstanceUID = instance.SeriesInstanceUID || seriesUID;
                    
                    // Make sure SOPInstanceUID is always defined
                    if (!instance.SOPInstanceUID) {
                      // First check if it's in the metadata
                      if (instance.metadata && instance.metadata.SOPInstanceUID) {
                        instance.SOPInstanceUID = instance.metadata.SOPInstanceUID;
                        console.log('XNAT: Using SOPInstanceUID from metadata:', instance.SOPInstanceUID);
                      } else {
                        // Only generate as a last resort
                        instance.SOPInstanceUID = generateRandomUID();
                        console.log('XNAT: Generated new SOPInstanceUID:', instance.SOPInstanceUID);
                      }
                    }
                    
                    // Make sure SOPClassUID is set - critical for display sets
                    if (!instance.SOPClassUID) {
                      // Check metadata first
                      if (instance.metadata && instance.metadata.SOPClassUID) {
                        instance.SOPClassUID = instance.metadata.SOPClassUID;
                        console.log('XNAT: Using SOPClassUID from metadata:', instance.SOPClassUID);
                      } else {
                        // Set appropriate SOP Class based on modality if available
                        if (series.Modality === 'MR') {
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.4'; // MR Image Storage
                        } else if (series.Modality === 'CT') {
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.2'; // CT Image Storage
                        } else if (series.Modality === 'PT') {
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.128'; // PET Image Storage
                        } else {
                          // Default to CT Image Storage as fallback
                          instance.SOPClassUID = '1.2.840.10008.5.1.4.1.1.2';
                        }
                        console.log('XNAT: Using modality-based SOPClassUID:', instance.SOPClassUID);
                      }
                    }
                    
                    // Also ensure it's in the metadata
                    if (instance.metadata) {
                      instance.metadata.StudyInstanceUID = instance.metadata.StudyInstanceUID || studyUid;
                      instance.metadata.SeriesInstanceUID = instance.metadata.SeriesInstanceUID || seriesUID;
                      instance.metadata.SOPInstanceUID = instance.metadata.SOPInstanceUID || instance.SOPInstanceUID;
                      instance.metadata.SOPClassUID = instance.metadata.SOPClassUID || instance.SOPClassUID;
                    }
                  });
                  
                  log.info(`XNAT: Adding ${instances.length} instances in batch for series ${seriesUID} of study ${studyUid}`);
                  
                  // Debug log to see what the instances contain
                  if (instances.length > 0) {
                    const sampleInstance = instances[0];
                    log.info(`XNAT: Sample instance details - StudyInstanceUID: ${sampleInstance.StudyInstanceUID}, SeriesInstanceUID: ${sampleInstance.SeriesInstanceUID}`);
                    log.info(`XNAT: Sample instance imageId: ${sampleInstance.imageId}`);
                    log.info(`XNAT: Sample instance url: ${sampleInstance.url}`);
                    
                    if (sampleInstance.metadata) {
                      log.info(`XNAT: Sample instance metadata - StudyInstanceUID: ${sampleInstance.metadata.StudyInstanceUID}, SeriesInstanceUID: ${sampleInstance.metadata.SeriesInstanceUID}`);
                    }
                  }
                  console.log('Adding instances to DicomMetadataStore');
                  // Add all instances for this series to DicomMetadataStore at once
                  DicomMetadataStore.addInstances(instances, true);
                  
                  // Simple log after instances are added
                  console.log('XNAT Study Metadata: Instances added to DicomMetadataStore');
                  console.log('Number of instances added:', instances.length);
                  console.log('1114 First instance sample:', {
                    StudyInstanceUID: instances[0].StudyInstanceUID,
                    SeriesInstanceUID: instances[0].SeriesInstanceUID,
                    SOPInstanceUID: instances[0].SOPInstanceUID,
                    imageId: instances[0].imageId,
                    url: instances[0].url,
                    metadata: instances[0].metadata ? 'present' : 'missing',
                    displaySetInstanceUID: instances[0].displaySetInstanceUID
                  });
                  console.log('All display sets:', DicomMetadataStore);
                }
              }
            }
            
            console.log(`XNAT: Processed study with ${processedStudy.series.length} series and ${processedStudy.instances.length} instances`);
            if (processedStudy.instances.length > 0) {
              console.log('XNAT: First instance URL (example):', processedStudy.instances[0]?.url);
              console.log('XNAT: First instance imageId (example):', processedStudy.instances[0]?.imageId);
              console.log('XNAT: First instance displaySetInstanceUID (example):', processedStudy.instances[0]?.displaySetInstanceUID);
            }
            
            // Handle batch mode if needed
            const batchMode = options && options.batch === true;
            if (batchMode) {
              // In batch mode, we might need to add all instances to the DicomMetadataStore
              const enableStudyLazyLoad = xnatConfig.enableStudyLazyLoad === undefined ? false : xnatConfig.enableStudyLazyLoad;
              const madeInClient = options && options.madeInClient === true;
              
              if (enableStudyLazyLoad === false && processedStudy.instances.length > 0) {
                try {
                  // Add all instances to DicomMetadataStore at once
                  await DicomMetadataStore.addInstances(processedStudy.instances, madeInClient);
                  console.log('XNAT: Successfully added instances to DicomMetadataStore in batch mode');
                } catch (error) {
                  console.error('XNAT: Error adding instances to DicomMetadataStore in batch mode:', error);
                }
              }
            }
            
            // Initialize the metadata provider to help with cornerstone loading
            try {
              const globalProvider = (window as any).cornerstone?.metaData;
              if (globalProvider && typeof globalProvider.add === 'function') {
                processedStudy.instances.forEach(instance => {
                  if (instance.SOPInstanceUID && instance.imageId) {
                    // Add each metadata element to cornerstone provider
                    Object.entries(instance).forEach(([key, value]) => {
                      if (key !== 'imageId' && value !== undefined) {
                        globalProvider.add(key, instance.imageId, value);
                      }
                    });
                  }
                });
                log.info('XNAT: Added study instances metadata to cornerstone provider');
              }
            } catch (error) {
              log.error('XNAT: Error adding study instances to cornerstone provider:', error);
            }
            
            return processedStudy;
          } catch (error) {
            console.error('XNAT: Error retrieving or processing study metadata:', error);
            return null;
          }
        },
        
        dicomWeb: async (studyInstanceUID, filters) => {
          console.log('XNAT retrieve study dicomWeb');
          if (!wadoDicomWebClient) {
            console.error('wadoDicomWebClient not available - study dicomWeb retrieval may fail');
            return;
          }
          wadoDicomWebClient.headers = getAuthorizationHeader();
          
          return wadoDicomWebClient.retrieveStudy({
            studyInstanceUID,
            queryParams: filters,
          });
        },
      },
      
      instance: {
        metadata: async function (
          studyInstanceUID,
          seriesInstanceUID,
          sopInstanceUID
        ) {
          console.log('XNAT retrieve instance metadata');
          if (!wadoDicomWebClient) {
            console.error('wadoDicomWebClient not available - instance metadata retrieval may fail');
            return;
          }
          wadoDicomWebClient.headers = getAuthorizationHeader();
          
          const instance = await wadoDicomWebClient.retrieveInstanceMetadata({
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
          });
          
          return naturalizeDataset(instance);
        },
        
        rendered: async function (
          studyInstanceUID,
          seriesInstanceUID,
          sopInstanceUID,
          frameNumbers
        ) {
          console.log('XNAT retrieve instance rendered');
          if (!wadoDicomWebClient) {
            console.error('wadoDicomWebClient not available - instance rendered retrieval may fail');
            return;
          }
          wadoDicomWebClient.headers = getAuthorizationHeader();
          
          const config = {
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
            frameNumbers,
            acceptHeader: 'image/jpeg',
          };
          
          return wadoDicomWebClient.retrieveInstanceRendered(config);
        },
        
        framesSingleFrame: async function (
          studyInstanceUID,
          seriesInstanceUID,
          sopInstanceUID,
          frameNumbers
        ) {
          console.log('XNAT retrieve instance framesSingleFrame');
          if (!wadoDicomWebClient) {
            console.error('wadoDicomWebClient not available - instance framesSingleFrame retrieval may fail');
            return;
          }
          wadoDicomWebClient.headers = getAuthorizationHeader();
          
          return wadoDicomWebClient.retrieveInstanceFrames({
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
            frameNumbers,
          });
        },
        
        bulkdata: async function (
          studyInstanceUID,
          seriesInstanceUID,
          sopInstanceUID,
          bulkdataInfo
        ) {
          console.log('XNAT retrieve instance bulkdata');
          if (!wadoDicomWebClient) {
            console.error('wadoDicomWebClient not available - instance bulkdata retrieval may fail');
            return;
          }
          wadoDicomWebClient.headers = getAuthorizationHeader();
          
          return wadoDicomWebClient.retrieveBulkData({
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
            bulkdataInfo,
          });
        },
        
        originalBulkData: async function (
          studyInstanceUID,
          seriesInstanceUID,
          sopInstanceUID,
          bulkDataURI
        ) {
          console.log('XNAT retrieve instance originalBulkData');
          if (!wadoDicomWebClient) {
            console.error('wadoDicomWebClient not available - instance originalBulkData retrieval may fail');
            return;
          }
          wadoDicomWebClient.headers = getAuthorizationHeader();
          
          return wadoDicomWebClient.retrieveBulkData({
            studyInstanceUID,
            seriesInstanceUID,
            sopInstanceUID,
            bulkDataURI,
          });
        },
      },
    },
    
    store: {
      dicom: async function (datasets) {
        console.log('XNAT store dicom');
        if (!wadoDicomWebClient) {
          console.error('wadoDicomWebClient not available - store dicom may fail');
          return;
        }
        wadoDicomWebClient.headers = getAuthorizationHeader();
        
        const naturalizedDatasets = Array.isArray(datasets)
          ? datasets.map(naturalizeDataset)
          : [naturalizeDataset(datasets)];
        
        const denaturalizedDatasets = naturalizedDatasets.map(denaturalizeDataset);
        
        return wadoDicomWebClient.storeInstances({
          datasets: denaturalizedDatasets,
        });
      },
    },
    
    deleteStudyMetadataPromise,
    getImageId,
    
    // Add the XNAT-specific methods before the getImageIdsForDisplaySet method:
    
    xnat: {
      /**
       * Fetches experiment metadata from the XNAT API
       * 
       * @param {string} projectId - The XNAT project ID
       * @param {string} experimentId - The XNAT experiment ID
       * @returns {Promise<any>} - The experiment metadata
       */
      getExperimentMetadata: async function(projectId, experimentId) {
        console.log('XNAT: Fetching experiment metadata for', projectId, experimentId);
        
        if (!projectId || !experimentId) {
          console.error('XNAT: Missing projectId or experimentId for metadata fetch');
          return null;
        }
        
        try {
          // Use the wadoRoot from configuration as the base URL
          const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
          console.log('XNAT: Using base URL from configuration:', baseUrl);
          
          // Always construct a standardized API URL path
          const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
          
          // Check if baseUrl already contains the XNAT API path
          if (baseUrl.includes('/xapi/viewer/projects/')) {
            console.log('XNAT: Base URL already contains the XNAT API path, avoiding duplication');
            
            // Use convertToAbsoluteUrl which now handles path duplication
            const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
            console.log('XNAT: Constructed API URL:', apiUrl);
            
            const headers = getAuthorizationHeader();
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...headers
              }
            });
            
            if (!response.ok) {
              console.error('XNAT: Failed to fetch experiment metadata', response.status, response.statusText);
              throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
            }
            
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            console.log('XNAT: Response content type:', contentType);
            
            // Get the response as text first to inspect it
            const responseText = await response.text();
            console.log('XNAT: Raw response (first 100 chars):', responseText.substring(0, 100));
            
            // Try to parse it as JSON
            let data;
            try {
              data = JSON.parse(responseText);
              console.log('XNAT: Successfully parsed JSON response', data);
            } catch (parseError) {
              console.error('XNAT: Error parsing JSON response:', parseError);
              console.error('XNAT: Response was not valid JSON. Raw data (first 100 chars):', responseText.substring(0, 100));
              throw new Error('Failed to parse JSON response from XNAT API');
            }
            
            console.log('XNAT: Successfully fetched experiment metadata');
            console.log('XNAT: DicomMetadataStore:', DicomMetadataStore);
            
            return data;
          } else {
            // Normal case - just append the path to the base URL
            const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
            console.log('XNAT: Constructed API URL:', apiUrl);
            
            const headers = getAuthorizationHeader();
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...headers
              }
            });
            
            if (!response.ok) {
              console.error('XNAT: Failed to fetch experiment metadata', response.status, response.statusText);
              throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
            }
            
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            console.log('XNAT: Response content type:', contentType);
            
            // Get the response as text first to inspect it
            const responseText = await response.text();
            console.log('XNAT: Raw response (first 100 chars):', responseText.substring(0, 100));
            
            // Try to parse it as JSON
            let data;
            try {
              data = JSON.parse(responseText);
              console.log('XNAT: Successfully parsed JSON response', data);
            } catch (parseError) {
              console.error('XNAT: Error parsing JSON response:', parseError);
              console.error('XNAT: Response was not valid JSON. Raw data (first 100 chars):', responseText.substring(0, 100));
              throw new Error('Failed to parse JSON response from XNAT API');
            }
            
            console.log('XNAT: Successfully fetched experiment metadata');
            console.log('XNAT: DicomMetadataStore:', DicomMetadataStore);
            
            return data;
          }
        } catch (error) {
          console.error('XNAT: Error fetching experiment metadata:', error);
          throw error;
        }
      },
      
      /**
       * Fetches subject metadata from the XNAT API
       * 
       * @param {string} projectId - The XNAT project ID
       * @param {string} subjectId - The XNAT subject ID
       * @returns {Promise<any>} - The subject metadata
       */
      getSubjectMetadata: async function(projectId, subjectId) {
        console.log('XNAT: Fetching subject metadata for', projectId, subjectId);
        
        if (!projectId || !subjectId) {
          console.error('XNAT: Missing projectId or subjectId for metadata fetch');
          return null;
        }
        
        try {
          // Use the wadoRoot from configuration as the base URL
          const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
          console.log('XNAT: Using base URL from configuration:', baseUrl);
          
          // Construct a standardized API URL path
          const apiPath = `/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
          const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
          
          console.log('XNAT: Constructed API URL:', apiUrl);
          
          const headers = getAuthorizationHeader();
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          });
          
          if (!response.ok) {
            console.error('XNAT: Failed to fetch subject metadata', response.status, response.statusText);
            throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('XNAT: Successfully fetched subject metadata', data);
          return data;
        } catch (error) {
          console.error('XNAT: Error fetching subject metadata:', error);
          throw error;
        }
      },
      
      /**
       * Fetches project metadata from the XNAT API
       * 
       * @param {string} projectId - The XNAT project ID
       * @returns {Promise<any>} - The project metadata
       */
      getProjectMetadata: async function(projectId) {
        console.log('XNAT: Fetching project metadata for', projectId);
        
        if (!projectId) {
          console.error('XNAT: Missing projectId for metadata fetch');
          return null;
        }
        
        try {
          // Use the wadoRoot from configuration as the base URL
          const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
          console.log('XNAT: Using base URL from configuration:', baseUrl);
          
          // Construct a standardized API URL path
          const apiPath = `/xapi/viewer/projects/${projectId}`;
          const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
          
          console.log('XNAT: Constructed API URL:', apiUrl);
          
          const headers = getAuthorizationHeader();
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          });
          
          if (!response.ok) {
            console.error('XNAT: Failed to fetch project metadata', response.status, response.statusText);
            throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('XNAT: Successfully fetched project metadata', data);
          return data;
        } catch (error) {
          console.error('XNAT: Error fetching project metadata:', error);
          throw error;
        }
      }
    },
    
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
        config: xnatConfig,
      });
      return imageIds;
    },
    
    getConfig,
    
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

  console.log('implementation', implementation);
  if (xnatConfig.supportsReject && typeof dcm4cheeReject === 'function') {
    console.log('reject');
    implementation['reject'] = dcm4cheeReject(xnatConfig.wadoRoot, getAuthorizationHeader);
  }

  return IWebApiDataSource.create(implementation as any);
}


// Export for use in the XNATDataSource and initialize it
export { createXNATApi, setupDisplaySetLogging };
export default createXNATApi;

// Add these utility functions at the top of the file, right after the constants
const getBaseUrl = (wadoRoot?: string): string => {
  // If wadoRoot is provided, extract just the protocol and domain
  if (wadoRoot) {
    try {
      const url = new URL(wadoRoot);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      console.error('XNAT: Error parsing wadoRoot as URL:', error);
    }
  }
  
  // If wadoRoot is not a valid URL or not provided, use the current location
  const windowLocation = window.location;
  return `${windowLocation.protocol}//${windowLocation.host}`;
};

const convertToAbsoluteUrl = (relativeUrl: string, baseUrl?: string, config?: XNATConfig): string => {
  if (!relativeUrl) {
    console.error('XNAT: Empty URL provided to convertToAbsoluteUrl');
    return '';
  }
    
  // If the URL is already absolute, return it as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  // Always use the wadoRoot from config if available
  if (config && config.wadoRoot) {
    
    // Make sure the wadoRoot doesn't end with a slash
    const cleanWadoRoot = config.wadoRoot.endsWith('/') ? config.wadoRoot.slice(0, -1) : config.wadoRoot;
    
    // Check if the relative URL contains a path that's already in the base URL
    // This prevents paths like http://localhost/xapi/viewer/projects/X/xapi/viewer/projects/X
    if (relativeUrl.startsWith('/') && relativeUrl.includes('/xapi/')) {
      // Extract just the path part from the relativeUrl
      const pathSegments = relativeUrl.split('/');
      const xapiIndex = pathSegments.findIndex(segment => segment === 'xapi');
      
      if (xapiIndex !== -1 && cleanWadoRoot.includes('/xapi/')) {
        // Base URL already has /xapi/ path - extract only domain part
        const urlParts = cleanWadoRoot.split('/xapi/');
        const domainPart = urlParts[0]; // Get just the domain part
        
        // Reconstruct the URL with just one instance of the path
        const fullUrl = `${domainPart}${relativeUrl}`;
        return fullUrl;
      }
    }
    
    // Normal case - make sure relative URL starts with a slash
    const cleanRelativeUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    const absoluteUrl = `${cleanWadoRoot}${cleanRelativeUrl}`;
    return absoluteUrl;
  }
  
  // If no baseUrl provided and no config.wadoRoot, use window location
  let effectiveBaseUrl = baseUrl || `${window.location.protocol}//${window.location.host}`;
  
  // Ensure the relative URL is properly formatted
  // 1. If the relative URL doesn't start with a slash, add one
  let normalizedPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  
  // 2. Make sure we don't end up with double slashes when joining
  if (effectiveBaseUrl.endsWith('/')) {
    effectiveBaseUrl = effectiveBaseUrl.slice(0, -1);
  }
  
  // 3. Check for duplicate paths
  if (normalizedPath.includes('/xapi/') && effectiveBaseUrl.includes('/xapi/')) {
    // Extract base domain
    const urlParts = effectiveBaseUrl.split('/xapi/');
    effectiveBaseUrl = urlParts[0]; // Use only the domain part
  }
  
  // Combine the base URL with the normalized path
  const absoluteUrl = `${effectiveBaseUrl}${normalizedPath}`;
  console.log('XNAT: Final absolute URL:', absoluteUrl);
  
  return absoluteUrl;
};

// Type definitions
interface DICOMWebSeriesMetadata {
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  [key: string]: any;
}

/**
 * Extract XNAT project and experiment IDs from StudyInstanceUID or from configuration
 */
const getXNATStatusFromStudyInstanceUID = (studyInstanceUID: string, config: XNATConfig): { projectId: string; experimentId: string } => {
  // First try to get from config
  let projectId = config.xnat?.projectId;
  let experimentId = config.xnat?.experimentId || config.xnat?.sessionId;
  
  if (projectId && experimentId) {
    return { projectId, experimentId };
  }
  
  // Try to get from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for project ID in URL
  const possibleProjectParams = ['projectId', 'project', 'proj'];
  for (const param of possibleProjectParams) {
    const value = urlParams.get(param);
    if (value) {
      projectId = value;
      log.debug(`XNAT: Found project ID in URL parameter '${param}': ${projectId}`);
      break;
    }
  }
  
  // Check for experiment ID in URL
  const possibleExperimentParams = ['experimentId', 'experiment', 'session', 'exam', 'scan'];
  for (const param of possibleExperimentParams) {
    const value = urlParams.get(param);
    if (value) {
      experimentId = value;
      log.debug(`XNAT: Found experiment ID in URL parameter '${param}': ${experimentId}`);
      break;
    }
  }
  
  // If we still don't have project/experiment IDs, try to derive from StudyInstanceUID
  if ((!projectId || !experimentId) && studyInstanceUID) {
    log.debug('XNAT: Attempting to derive project/experiment from StudyInstanceUID:', studyInstanceUID);
    
    if (!experimentId) {
      experimentId = studyInstanceUID;
      log.debug('XNAT: Using StudyInstanceUID as experimentId:', experimentId);
    }
    
    if (!projectId) {
      projectId = "defaultProject";
      log.debug('XNAT: Using default project ID:', projectId);
    }
  }
  
  return { projectId, experimentId };
};

/**
 * Add instances to the DicomMetadataStore in batch
 * @param instances Single instance or array of instances to add
 * @param seriesUID Optional series UID to use if not present in the instances
 */
const addInstancesToMetadataStore = (instances: any | any[], seriesUID?: string): void => {
  // Convert single instance to array for consistent processing
  const instancesArray = Array.isArray(instances) ? instances : [instances];
  if (instancesArray.length === 0) return;
  
  try {
    // Process all instances for batch addition
    const enhancedInstances = instancesArray.map(instance => {
      // Check if SOPInstanceUID is in metadata
      const metadata = instance.metadata || {};
      const sopInstanceUID = instance.SOPInstanceUID || metadata.SOPInstanceUID;
      
      // Get StudyInstanceUID and SeriesInstanceUID for reference
      const studyUID = instance.StudyInstanceUID || metadata.StudyInstanceUID;
      const seriesInstanceUID = instance.SeriesInstanceUID || seriesUID || metadata.SeriesInstanceUID;
      
      // Ensure instance has all required fields for Cornerstone
      return {
        ...instance,
        ...metadata, // Spread metadata to make its properties directly available
        
        // Force correct flags for proper MPR reconstruction
        isReconstructable: true,
        isMultiFrame: false,
        
        // Make sure required imaging attributes are set
        Rows: metadata.Rows || instance.Rows || 512,
        Columns: metadata.Columns || instance.Columns || 512,
        
        // Add mandatory attributes for proper display
        PixelSpacing: metadata.PixelSpacing || instance.PixelSpacing || [1, 1],
        SliceThickness: metadata.SliceThickness || instance.SliceThickness || 1,
        
        // Important UIDs - use provided values or try to extract from filename as last resort
        SOPInstanceUID: sopInstanceUID || extractUIDFromFilename(instance.url) || generateRandomUID(),
        SeriesInstanceUID: seriesInstanceUID || generateRandomUID(),
        StudyInstanceUID: studyUID || (instance.url ? extractStudyUIDFromURL(instance.url) : null) || generateRandomUID(),
        
        // Frame of reference for linking volumes
        FrameOfReferenceUID: metadata.FrameOfReferenceUID || instance.FrameOfReferenceUID || generateRandomUID(),
        
        // Image type is required for proper rendering
        ImageType: instance.ImageType || ['ORIGINAL', 'PRIMARY', 'AXIAL'],
        
        // Instance number needed for proper ordering
        InstanceNumber: instance.InstanceNumber || '1',
        
        // Image position and orientation needed for MPR
        ImagePositionPatient: instance.ImagePositionPatient || [0, 0, 0],
        ImageOrientationPatient: instance.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
        
        // Bits properties needed for proper windowing
        BitsAllocated: instance.BitsAllocated || 16,
        BitsStored: instance.BitsStored || 16,
        HighBit: instance.HighBit || 15,
        
        // Add placeholders for commonly expected tags
        SamplesPerPixel: instance.SamplesPerPixel || 1,
        PhotometricInterpretation: instance.PhotometricInterpretation || 'MONOCHROME2',
        PixelRepresentation: instance.PixelRepresentation || 0,
        
        // Window values for display
        WindowCenter: instance.WindowCenter || metadata.WindowCenter || 40,
        WindowWidth: instance.WindowWidth || metadata.WindowWidth || 400,
        
        // Modality-specific attributes
        RescaleIntercept: instance.RescaleIntercept || metadata.RescaleIntercept || 0,
        RescaleSlope: instance.RescaleSlope || metadata.RescaleSlope || 1,
      };
    });
    
    log.info(`XNAT: Adding ${enhancedInstances.length} enhanced instances in batch`);
    
    // Force it to be a true "batch" add for proper handling
    const madeInClient = true;
    
    // Use the DicomMetadataStore directly with the madeInClient flag
    // Let the SOP class handler do the grouping by adding instances directly
    // without pre-assigning displaySetInstanceUIDs
    DicomMetadataStore.addInstances(enhancedInstances, madeInClient);
    
    // Add to cornerstone metadata provider directly if available
    try {
      const globalProvider = (window as any).cornerstone?.metaData;
      if (globalProvider && typeof globalProvider.add === 'function') {
        enhancedInstances.forEach(instance => {
          const imageId = instance.imageId;
          if (imageId) {
            // Add each metadata element to cornerstone provider
            Object.entries(instance).forEach(([key, value]) => {
              if (key !== 'imageId' && value !== undefined) {
                globalProvider.add(key, imageId, value);
              }
            });
          }
        });
        log.info('XNAT: Added instance metadata to cornerstone provider');
      }
    } catch (error) {
      log.error('XNAT: Error adding to cornerstone provider:', error);
    }
  } catch (error) {
    log.error('XNAT: Error adding instances to DicomMetadataStore:', error);
  }
};

/**
 * Fetch series instances metadata from XNAT
 */
const getSeriesXNATInstancesMetadata = async ({
  projectId,
  experimentId,
  seriesUID,
  implementation
}: {
  projectId: string;
  experimentId: string;
  seriesUID?: string;
  implementation: any;
}): Promise<DICOMWebSeriesMetadata[]> => {
  try {
    // Use the XNAT-specific method to get experiment metadata
    const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
    
    if (!xnatMetadata || !xnatMetadata.studies || xnatMetadata.studies.length === 0) {
      log.error('XNAT: No valid metadata returned from XNAT API');
      return [];
    }
    
    log.info('XNAT: Successfully retrieved metadata from XNAT API');
    
    // Extract all series from all studies
    const allSeries: DICOMWebSeriesMetadata[] = [];
    xnatMetadata.studies.forEach(study => {
      if (study.series && study.series.length > 0) {
        study.series.forEach(series => {
          // Add source study info to each series for reference
          series.StudyInstanceUID = study.StudyInstanceUID;
          
          // Mark series as reconstructable for the MPR view
          const isMultiFrame = false;
          const isReconstructable = true;
          
          // Enhance series with necessary attributes for display set creation
          const enhancedSeries = {
            ...series,
            // Ensure essential series attributes are present
            Modality: series.Modality || 'CT',
            SeriesDescription: series.SeriesDescription || 'XNAT Series',
            SeriesNumber: series.SeriesNumber || '1',
            SeriesDate: series.SeriesDate || study.StudyDate || '',
            SeriesTime: series.SeriesTime || study.StudyTime || '',
            
            // Critical for MPR reconstruction - FORCE these to be true
            isMultiFrame: isMultiFrame,
            isReconstructable: isReconstructable,
            
            // Essential for study/series identification
            StudyInstanceUID: study.StudyInstanceUID
          };
          
          // Process and enhance each instance
          if (series.instances && series.instances.length > 0) {
            // Sort instances if available by InstanceNumber
            enhancedSeries.instances = [...series.instances]
              .sort((a, b) => {
                const aNum = parseInt(a.metadata?.InstanceNumber || '0');
                const bNum = parseInt(b.metadata?.InstanceNumber || '0');
                return aNum - bNum;
              })
              .map(instance => {
                // Enhance instance with essential attributes
                return {
                  ...instance,
                  // Force MPR reconstruction flags
                  isReconstructable: isReconstructable,
                  isMultiFrame: isMultiFrame,
                  
                  // Make sure metadata has essential attributes
                  metadata: {
                    ...(instance.metadata || {}),
                    isReconstructable: isReconstructable,
                    isMultiFrame: isMultiFrame
                  }
                };
              });
          }
          
          allSeries.push(enhancedSeries);
        });
      }
    });
    
    log.debug(`XNAT: Found ${allSeries.length} series in total`);
    
    // Filter by seriesInstanceUID if provided
    const filteredSeries = seriesUID 
      ? allSeries.filter(series => series.SeriesInstanceUID === seriesUID)
      : allSeries;
    
    log.debug(`XNAT: Filtered to ${filteredSeries.length} series ${
      seriesUID ? `matching ${seriesUID}` : 'across all studies'
    }`);
    
    return filteredSeries;
  } catch (error) {
    log.error('XNAT: Error retrieving or processing metadata:', error);
    return [];
  }
};



// Create a listener for display sets
function setupDisplaySetLogging() {
  // Check if the DicomMetadataStore is initialized
  if (DicomMetadataStore && DicomMetadataStore.EVENTS) {
    console.log('XNAT: Setting up display set logging');
    
    // Add listener for instances added event
    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.INSTANCES_ADDED,
      function({ instances, madeInClient }) {
        console.log('XNAT: New DICOM instances added to store', {
          StudyInstanceUID: instances[0]?.StudyInstanceUID,
          SeriesInstanceUID: instances[0]?.SeriesInstanceUID,
          madeInClient,
          numInstances: instances.length,
          firstSOPInstanceUID: instances[0]?.SOPInstanceUID
        });
      }
    );
    
    // Also subscribe to series added event
    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.SERIES_ADDED,
      function({ series }) {
        console.log('XNAT: Series added to DicomMetadataStore', {
          SeriesInstanceUID: series.SeriesInstanceUID,
          StudyInstanceUID: series.StudyInstanceUID,
          Modality: series.Modality,
          SeriesDescription: series.SeriesDescription,
          NumInstances: series.instances?.length || 0
        });
      }
    );
    
    // Subscribe to study added event
    DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.STUDY_ADDED,
      function({ study }) {
        console.log('XNAT: Study added to DicomMetadataStore', {
          StudyInstanceUID: study.StudyInstanceUID,
          PatientName: study.PatientName,
          NumSeries: study.series?.length || 0,
          TotalInstances: study.instances?.length || 0
        });
        
        // Find out if the core is creating DisplaySets for this study
        setTimeout(() => {
          console.log('XNAT: Checking display sets 1 second after study added');
          // Check the data from DicomMetadataStore by using window
          const displaySets = (window as any).displaySets || [];
          console.log('XNAT: Display sets found:', displaySets.length);
          
          if (displaySets.length > 0) {
            console.log('XNAT: First display set:', displaySets[0]);
          } else {
            console.log('XNAT: No display sets found - possible issue with instances:', study.instances?.[0]);
          }
        }, 1000);
      }
    );
  }
}

