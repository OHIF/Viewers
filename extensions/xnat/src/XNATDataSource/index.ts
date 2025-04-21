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
import {
  getXNATStatusFromStudyInstanceUID,
  getSeriesXNATInstancesMetadata,
  convertToAbsoluteUrl,
  setupDisplaySetLogging,
} from './Utils/DataSourceUtils';
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

      
      // Set up display set logging
      try {
        // Now calls the defined function
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
        mapParams: mapParams.bind({}), // Consider if mapParams needs config
        search: async function (origParams) {
          // Extract study instance UID from params
          let studyInstanceUid = origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
          // If no studyInstanceUid directly provided, check if it's in a nested object
          if (!studyInstanceUid && typeof origParams === 'object' && origParams !== null) {
            if (origParams.studyInstanceUid) {
              studyInstanceUid = origParams.studyInstanceUid;
            }
          }
          
          // Extract XNAT identifiers using the helper function
          const { projectId, experimentId } = getXNATStatusFromStudyInstanceUID(studyInstanceUid, xnatConfig);
          
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
                "00080061": { vr: "CS", Value: study.Modalities},
                "00080090": { vr: "PN", Value: [{ Alphabetic: study.ReferringPhysicianName || "" }] },
                "00081190": { vr: "UR", Value: [xnatConfig.qidoRoot || ""] },
                "00100010": { vr: "PN", Value: [{ Alphabetic: study.PatientName || "Anonymous" }] },
                "00100020": { vr: "LO", Value: [study.PatientID || ""] },
                "00100030": { vr: "DA", Value: [study.PatientBirthDate || ""] },
                "00100040": { vr: "CS", Value: [study.PatientSex || ""] },
                // Ensure the StudyInstanceUID matches the one used for the query if available
                "0020000D": { vr: "UI", Value: [studyInstanceUid || study.StudyInstanceUID || xnatMetadata.transactionId] },
                "00200010": { vr: "SH", Value: [study.StudyID || ""] },
                "00081030": { vr: "LO", Value: [study.StudyDescription || "XNAT Study"] }
              };
              
              // Add series count
              if (study.series && study.series.length) {
                result["00201206"] = { vr: "IS", Value: [study.series.length.toString()] };
                
                // Get modalities from series
                const modalities = new Set<string>(); // Use Set<string>
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
            
            // Define paramMap type explicitly and ensure origParams is an object
            const validOrigParams = typeof origParams === 'object' && origParams !== null ? origParams : {};
            // Ensure the result of mapParams is treated as an object
            const mappedResult = mapParams(validOrigParams, {
              supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
              supportsWildcard: xnatConfig.supportsWildcard,
            });
            const paramMap: Record<string, any> = typeof mappedResult === 'object' && mappedResult !== null ? mappedResult : {};
            
            // Extract study and series UIDs separately to avoid destructuring issues
            const queryStudyInstanceUid = paramMap.studyInstanceUID || origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
            const querySeriesInstanceUid = paramMap.seriesInstanceUID;
            
            // Remove these properties to prevent duplicate parameters
            delete paramMap.studyInstanceUID;
            delete paramMap.seriesInstanceUID;

            const results = await qidoSearch(qidoDicomWebClient, queryStudyInstanceUid, querySeriesInstanceUid, paramMap);
            return processResults(results);
          }
        },
      },
      
      series: {
        search: async function (studyInstanceUidParam, filters) { // Renamed parameter
          
          if (!qidoDicomWebClient) {
            console.error('qidoDicomWebClient not available - series search may fail');
            return [];
          }
          qidoDicomWebClient.headers = getAuthorizationHeader();
          
          // Ensure studyInstanceUid is a string
          let studyInstanceUid: string;
          if (typeof studyInstanceUidParam !== 'string') {
            console.warn('XNAT series search: studyInstanceUidParam is not a string', studyInstanceUidParam);
            if (studyInstanceUidParam?.StudyInstanceUID) {
              studyInstanceUid = studyInstanceUidParam.StudyInstanceUID;
            } else if (studyInstanceUidParam?.studyInstanceUID) {
              studyInstanceUid = studyInstanceUidParam.studyInstanceUID;
            } else {
              console.error('XNAT series search: Unable to determine studyInstanceUid');
              return [];
            }
          } else {
            studyInstanceUid = studyInstanceUidParam;
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
        // Return the value unmodified if config or instance is missing
        return value;
      },
      
      series: {
        // Define the type for the input object more accurately
        metadata: async (params: {
            StudyInstanceUID?: string;
            SeriesInstanceUID?: string;
            returnPromises?: boolean;
            filters?: Record<string, any>; // Or a more specific filter type
            sortCriteria?: any; // Define if needed
            madeInClient?: boolean; // Add madeInClient to the type definition
          } = {}) => {
          // Destructure with default values
          const {
            StudyInstanceUID: inputStudyInstanceUID,
            SeriesInstanceUID,
            returnPromises = false,
            filters,
            sortCriteria, // Not used in current logic, but keep for type safety
            madeInClient = false, // Default value for madeInClient
          } = params;

          // Ensure filters is correctly typed or default
          const currentMetadataFilters = typeof filters === 'object' && filters !== null ? filters : {};

          let StudyInstanceUID = inputStudyInstanceUID; // Use a mutable variable

          try {
            // Import the DeferredPromise utilities
            const { wrapArrayWithDeferredPromises } = await import('../utils/DeferredPromise');
            
            log.info('XNAT: retrieve.series.metadata', {
              StudyInstanceUID,
              SeriesInstanceUID,
              returnPromises,
              filters,
            });

            // If no StudyInstanceUID provided, check session storage or URL parameters
            if (!StudyInstanceUID) {
              log.warn('XNAT: No StudyInstanceUID provided - trying to find one from configuration or URL');
              
              // First try to get from sessionStorage
              try {
                const storedUID = sessionStorage.getItem('xnat_studyInstanceUID');
                if (storedUID) {
                  log.info(`XNAT: Using last selected StudyInstanceUID from sessionStorage: ${storedUID}`);
                  StudyInstanceUID = storedUID;
                }
              } catch (e) {
                log.warn('XNAT: Error accessing sessionStorage:', e);
              }
              
              // If still no studyUID, try to get from URL parameters
              if (!StudyInstanceUID) {
                // Try to get from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const studyFromUrl = urlParams.get('studyInstanceUID');
                if (studyFromUrl) {
                  log.info(`XNAT: Using StudyInstanceUID from URL parameter: ${studyFromUrl}`);
                  StudyInstanceUID = studyFromUrl;
                } else {
                  // Try to get from URL path
                  const urlPath = window.location.pathname;
                  const parts = urlPath.split('/');
                  const studyIndex = parts.findIndex(part => part === 'study');
                  if (studyIndex >= 0 && parts.length > studyIndex + 1) {
                    log.info(`XNAT: Using StudyInstanceUID from URL path: ${parts[studyIndex + 1]}`);
                    StudyInstanceUID = parts[studyIndex + 1];
                  } else {
                    // Try to get project ID and experiment ID from URL
                    const projectId = urlParams.get('projectId');
                    const experimentId = urlParams.get('experimentId');
                    if (projectId && experimentId) {
                      log.info(`XNAT: Found project ID in URL parameter 'projectId': ${projectId}`);
                      log.info(`XNAT: Found experiment ID in URL parameter 'experimentId': ${experimentId}`);
                      // Use experimentId as study instance UID
                      StudyInstanceUID = experimentId;
                    } else {
                      // Try to get from XNAT configuration
                      if (xnatConfig.xnat?.experimentId) {
                        log.info(`XNAT: Using experimentId as StudyInstanceUID: ${xnatConfig.xnat.experimentId}`);
                        StudyInstanceUID = xnatConfig.xnat.experimentId;
                      } else {
                        throw new Error('No StudyInstanceUID provided and cannot determine one from context');
                      }
                    }
                  }
                }
              }
            }

            // Extract XNAT identifiers from config using the helper function
            const xnatData = getXNATStatusFromStudyInstanceUID(StudyInstanceUID, xnatConfig);
            const { projectId, experimentId } = xnatData;

            if (!projectId || !experimentId) {
              throw new Error(`Failed to extract XNAT identifiers from StudyInstanceUID: ${StudyInstanceUID}`);
            }

            log.debug('XNAT: Getting series metadata for', {
              projectId,
              experimentId,
              SeriesInstanceUID, // Use the destructured SeriesInstanceUID
            });

            // Fetch all instances for the series (or all series if SeriesInstanceUID not provided)
            // Calls the defined helper function
            const seriesData = await getSeriesXNATInstancesMetadata({
              projectId,
              experimentId,
              seriesUID: SeriesInstanceUID, // Pass the specific SeriesInstanceUID if provided
              implementation,
            });

            if (!seriesData || !seriesData.length) {
              // Adjust error message based on whether a specific series was requested
              const errorMsg = SeriesInstanceUID
                 ? `No series data found for series ${SeriesInstanceUID} in study ${StudyInstanceUID}`
                 : `No series data found for study ${StudyInstanceUID}`;
              throw new Error(errorMsg);
            }

            // Always use the fetched series data (could be filtered or all)
            const filteredSeriesData = seriesData;
            
            // Log the number of series we're loading
            log.info(`XNAT: Loading ${filteredSeriesData.length} series for study ${StudyInstanceUID}`);
            
            // Handle returnPromises option (used by the defaultRouteInit function)
            if (returnPromises) {
              
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
                        // Calls the defined helper function
                        const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                        
                        // Set URL and imageId
                        instance.url = absoluteUrl;
                        instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                        
                        // --- ADD URL TO METADATA ---
                        instance.metadata = instance.metadata || {}; // Ensure metadata object exists
                        instance.metadata.url = absoluteUrl; // Add the URL here
                        // --- END ADDITION ---
                        
                        // Critical for MPR - FORCE these to be true for each instance
                        instance.isReconstructable = true;
                        instance.isMultiFrame = false;
                        
                        // Instead of adding to DicomMetadataStore now, collect all instances first
                        processedInstances.push(instance);
                      });
                      console.log('Processed Instances', processedInstances);
                      // Add all instances at once in a batch
                      // Ensure filters is an object and check for properties safely
                      const currentFilters = typeof filters === 'object' && filters !== null ? filters : {};
                      if (processedInstances.length > 0 && !currentFilters?.batch) { // Optional chaining for safety
                        // Make sure every instance has proper StudyInstanceUID and SeriesInstanceUID
                        processedInstances.forEach(instance => {
                          instance.StudyInstanceUID = instance.StudyInstanceUID || series.StudyInstanceUID;
                          instance.SeriesInstanceUID = instance.SeriesInstanceUID || series.SeriesInstanceUID;
                          instance.SeriesDescription = instance.SeriesDescription || series.SeriesDescription;
                          // Make sure SOPInstanceUID is always defined
                          if (!instance.SOPInstanceUID) {
                            // First check if it's in the metadata
                            if (instance.metadata && instance.metadata.SOPInstanceUID) {
                              instance.SOPInstanceUID = instance.metadata.SOPInstanceUID;
                            } else {
                              // Only generate as a last resort
                              instance.SOPInstanceUID = generateRandomUID();
                            }
                          }
                          
                          // Make sure SOPClassUID is set - critical for display sets
                          if (!instance.SOPClassUID) {
                            // Check metadata first
                            if (instance.metadata && instance.metadata.SOPClassUID) {
                              instance.SOPClassUID = instance.metadata.SOPClassUID;
                            } else {
                              // Set appropriate SOP Class based on modality if available
                              const sopClassUID = getSOPClassUIDForModality(series.Modality);
                              instance.SOPClassUID = sopClassUID;
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
                          
                          // Ensure ImageType is copied to the top level if available in metadata
                          if (!instance.ImageType && instance.metadata && instance.metadata.ImageType) {
                            instance.ImageType = instance.metadata.ImageType;
                          }
                          // Ensure Modality
                          if (!instance.Modality && instance.metadata && instance.metadata.Modality) {
                            instance.Modality = instance.metadata.Modality;
                          }
                          // Ensure FrameOfReferenceUID
                          if (!instance.FrameOfReferenceUID && instance.metadata && instance.metadata.FrameOfReferenceUID) {
                            instance.FrameOfReferenceUID = instance.metadata.FrameOfReferenceUID;
                          }
                          // Ensure ProtocolName
                          if (!instance.ProtocolName && instance.metadata && instance.metadata.ProtocolName) {
                            instance.ProtocolName = instance.metadata.ProtocolName;
                          }
                          // Ensure SeriesDescription (already done earlier, but ensure consistency)
                          if (!instance.SeriesDescription && instance.metadata && instance.metadata.SeriesDescription) {
                            instance.SeriesDescription = instance.metadata.SeriesDescription;
                          }
                        });
                        
                        log.info(`XNAT: Adding ${processedInstances.length} instances in batch for series ${series.SeriesInstanceUID} of study ${series.StudyInstanceUID}`);
                        
                        DicomMetadataStore.addInstances(processedInstances, true);
                        console.log('Series', series);
                       
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
                  // Calls the defined helper function
                  const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                  
                  // Set URL and imageId
                  instance.url = absoluteUrl;
                  instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                  
                  // --- ADD URL TO METADATA ---
                  instance.metadata = instance.metadata || {}; // Ensure metadata object exists
                  instance.metadata.url = absoluteUrl; // Add the URL here
                  // --- END ADDITION ---
                  
                  // Instead of adding to DicomMetadataStore one by one, collect all instances first
                  processedInstances.push(instance);
                });
                
                // Add all instances at once in a batch
                // Ensure filters is an object and check for properties safely
                const currentFilters = typeof filters === 'object' && filters !== null ? filters : {};
                if (processedInstances.length > 0 && !currentFilters?.batch) { // Optional chaining for safety
                  // Make sure every instance has proper StudyInstanceUID and SeriesInstanceUID
                  processedInstances.forEach(instance => {
                    instance.StudyInstanceUID = instance.StudyInstanceUID || series.StudyInstanceUID;
                    instance.SeriesInstanceUID = instance.SeriesInstanceUID || series.SeriesInstanceUID;
                    
                    // Make sure SOPInstanceUID is always defined
                    if (!instance.SOPInstanceUID) {
                      // First check if it's in the metadata
                      if (instance.metadata && instance.metadata.SOPInstanceUID) {
                        instance.SOPInstanceUID = instance.metadata.SOPInstanceUID;
                      } else {
                        // Only generate as a last resort
                        instance.SOPInstanceUID = generateRandomUID();
                      }
                    }
                    
                    // Make sure SOPClassUID is set - critical for display sets
                    if (!instance.SOPClassUID) {
                      // Check metadata first
                      if (instance.metadata && instance.metadata.SOPClassUID) {
                        instance.SOPClassUID = instance.metadata.SOPClassUID;
                      } else {
                        // Set appropriate SOP Class based on modality if available
                        const sopClassUID = getSOPClassUIDForModality(series.Modality);
                        instance.SOPClassUID = sopClassUID;
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

                    // Ensure ImageType is copied to the top level if available in metadata
                    if (!instance.ImageType && instance.metadata && instance.metadata.ImageType) {
                      instance.ImageType = instance.metadata.ImageType;
                    }
                    // Ensure Modality
                    if (!instance.Modality && instance.metadata && instance.metadata.Modality) {
                      instance.Modality = instance.metadata.Modality;
                    }
                    // Ensure FrameOfReferenceUID
                    if (!instance.FrameOfReferenceUID && instance.metadata && instance.metadata.FrameOfReferenceUID) {
                      instance.FrameOfReferenceUID = instance.metadata.FrameOfReferenceUID;
                    }
                    // Ensure ProtocolName
                    if (!instance.ProtocolName && instance.metadata && instance.metadata.ProtocolName) {
                      instance.ProtocolName = instance.metadata.ProtocolName;
                    }
                    // Ensure SeriesDescription (already done earlier, but ensure consistency)
                    if (!instance.SeriesDescription && instance.metadata && instance.metadata.SeriesDescription) {
                      instance.SeriesDescription = instance.metadata.SeriesDescription;
                    }
                  });
                  
                  log.info(`XNAT: Adding ${processedInstances.length} instances in batch for series ${series.SeriesInstanceUID} of study ${series.StudyInstanceUID}`);
                  
                  DicomMetadataStore.addInstances(processedInstances, true);
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
        // Define interface for options
        metadata: async function (studyInstanceUID, options: { batch?: boolean; madeInClient?: boolean } = {}) {
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
              
              if (!experimentId) {
                experimentId = studyUid;
              }
              
              if (!projectId) {
                projectId = "defaultProject";
              }
            }
          }
          
          
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
            }
            
            // Create a basic study object first
            const studyMetadataForStore = {
              StudyInstanceUID: studyUid,
              PatientID: xnatMetadata.studies?.[0]?.PatientID || 'Unknown',
              PatientName: xnatMetadata.studies?.[0]?.PatientName || 'Unknown',
              StudyDate: xnatMetadata.studies?.[0]?.StudyDate || '',
              StudyTime: xnatMetadata.studies?.[0]?.StudyTime || '',
              AccessionNumber: xnatMetadata.studies?.[0]?.AccessionNumber || '',
              ReferringPhysicianName: xnatMetadata.studies?.[0]?.ReferringPhysicianName || '',
              PatientBirthDate: xnatMetadata.studies?.[0]?.PatientBirthDate || '',
              PatientSex: xnatMetadata.studies?.[0]?.PatientSex || '',
              StudyID: xnatMetadata.studies?.[0]?.StudyID || '',
              StudyDescription: xnatMetadata.studies?.[0]?.StudyDescription || 'XNAT Study',
              // IMPORTANT: Store wadoRoot directly in the study metadata
              wadoRoot: xnatConfig.wadoRoot,
              ModalitiesInStudy: [], // Will be populated later
              NumInstances: 0, // Will be populated later
              NumSeries: 0, // Will be populated later
              // Add other relevant top-level study tags if available from xnatMetadata
              // Store the raw XNAT transaction details if needed
              xnatTransactionId: xnatMetadata.transactionId, 
            };
            
            // Add or update this study metadata in the DicomMetadataStore immediately
            // This ensures wadoRoot is present when series/instances are added later
            DicomMetadataStore.addStudy(studyMetadataForStore);
            log.info(`XNAT: Added/Updated study ${studyUid} in DicomMetadataStore with wadoRoot: ${studyMetadataForStore.wadoRoot}`);
            
            // Use this stored metadata object for further processing
            const processedStudy = {
              ...studyMetadataForStore, // Start with the stored metadata
              series: [],
              seriesMap: new Map(),
              instances: [],
              // Keep the original raw metadata if needed elsewhere
              rawMetadata: xnatMetadata, 
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
                        
                        // --- ADD URL TO METADATA ---
                        instance.metadata = instance.metadata || {}; // Ensure metadata object exists
                        instance.metadata.url = absoluteUrl; // Add the URL here
                        // --- END ADDITION ---
                        
                        // If metadata doesn't exist, create it
                        if (!instance.metadata) {
                          instance.metadata = {};
                        }
                        
                        // --- Revised Instance Metadata Construction ---
                        // Start with the metadata fetched from XNAT
                        const instanceMetadata = {
                          ...(instance.metadata || {}), // Ensure we start with an object

                          // Add/Overwrite necessary calculated or series-level info
                          url: absoluteUrl,
                          imageId: instance.imageId,
                          StudyInstanceUID: studyUid,
                          SeriesInstanceUID: series.SeriesInstanceUID,
                          Modality: series.Modality || instance.metadata?.Modality || 'CT', // Prioritize series modality

                          // Add fallbacks for critical tags ONLY if they are missing from instance.metadata
                          Rows: instance.metadata?.Rows || 512,
                          Columns: instance.metadata?.Columns || 512,
                          InstanceNumber: instance.metadata?.InstanceNumber || (index + 1).toString(),
                          SOPInstanceUID: instance.metadata?.SOPInstanceUID || instance.SOPInstanceUID || generateRandomUID(),
                          SOPClassUID: instance.metadata?.SOPClassUID || getSOPClassUIDForModality(series.Modality || instance.metadata?.Modality),
                          ImagePositionPatient: instance.metadata?.ImagePositionPatient || [0, 0, index],
                          ImageOrientationPatient: instance.metadata?.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
                          PixelSpacing: instance.metadata?.PixelSpacing || [1, 1],
                          SliceThickness: instance.metadata?.SliceThickness || 1,
                          SliceLocation: instance.metadata?.SliceLocation || index,
                          FrameOfReferenceUID: instance.metadata?.FrameOfReferenceUID || series.FrameOfReferenceUID || generateRandomUID(),

                          // Ensure MPR flags are set
                          isReconstructable: true,
                          isMultiFrame: false,

                          // Add custom XNAT properties
                          xnatProjectId: projectId,
                          xnatExperimentId: experimentId,
                        };

                        // Clean up potentially undefined keys (optional but good practice)
                        Object.keys(instanceMetadata).forEach(key => {
                          if (instanceMetadata[key] === undefined) {
                            delete instanceMetadata[key];
                          }
                        });
                        // --- End Revised Construction ---
                        
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
                        // IMPORTANT: Store the combined metadata temporarily
                        seriesInstancesMap.set(series.SeriesInstanceUID, [...existingInstances, ...seriesProcessedInstances]); 
                      }
                    }
                  });
                }
              });
              
              // Now add instances by series in batches, cleaning metadata first
              const instancesToAdd = [];
              for (const [seriesUID, instances] of seriesInstancesMap.entries()) {
                if (instances.length > 0) {
                  // Clean metadata for DicomMetadataStore
                  const cleanedInstances = instances.map(instance => {
                    const metadataForStore = {};
                    // Iterate over the original combined metadata
                    for (const key in instance) {
                      // Simple check for DICOM tag format (XXXX,XXXX) - adjust regex if needed
                      if (/^\(\d{4},\d{4}\)$/.test(key) || 
                          // Include essential identifiers even if not in tag format
                          ['StudyInstanceUID', 'SeriesInstanceUID', 'SOPInstanceUID', 'SOPClassUID'].includes(key)) {
                        metadataForStore[key] = instance[key];
                      }
                    }
                    // Ensure essential UIDs are present
                    metadataForStore['StudyInstanceUID'] = metadataForStore['StudyInstanceUID'] || instance.StudyInstanceUID;
                    metadataForStore['SeriesInstanceUID'] = metadataForStore['SeriesInstanceUID'] || instance.SeriesInstanceUID;
                    metadataForStore['SOPInstanceUID'] = metadataForStore['SOPInstanceUID'] || instance.SOPInstanceUID;
                    metadataForStore['SOPClassUID'] = metadataForStore['SOPClassUID'] || instance.SOPClassUID;
                    return metadataForStore;
                  });

                  instancesToAdd.push(...cleanedInstances);

                  // Optional: Populate MetadataProvider separately with combined data if needed by other components
                  try {
                    const globalProvider = (window as any).cornerstone?.metaData;
                    if (globalProvider && typeof globalProvider.add === 'function') {
                      instances.forEach(instanceWithCombinedMeta => {
                        if (instanceWithCombinedMeta.imageId) {
                          globalProvider.add('instance', instanceWithCombinedMeta.imageId, instanceWithCombinedMeta);
                          // Log to confirm what's being added to metadata provider
                          // console.log(`Added combined metadata for ${instanceWithCombinedMeta.imageId} to provider`);
                        }
                      });
                    } else {
                      log.warn('Cornerstone Metadata Provider not found or add function missing.');
                    }
                  } catch (error) {
                    log.error('XNAT: Error adding combined instance metadata to cornerstone provider:', error);
                  }
                }
              }

              // Add cleaned instances to DicomMetadataStore
              if (instancesToAdd.length > 0) {
                log.info(`XNAT: Adding ${instancesToAdd.length} cleaned instances to DicomMetadataStore.`);
                // Debug log to see what the cleaned instances contain
                if (instancesToAdd.length > 0) {
                  const sampleInstance = instancesToAdd[0];
                  log.info(`XNAT: Cleaned instance sample - StudyInstanceUID: ${sampleInstance.StudyInstanceUID}, SeriesInstanceUID: ${sampleInstance.SeriesInstanceUID}`);
                  // Check a few expected tags
                  log.info(`XNAT: Cleaned instance sample - ImageType: ${sampleInstance['(0008,0008)']}`); 
                  log.info(`XNAT: Cleaned instance sample - url exists?: ${!!sampleInstance.url}`); // Should be false
                  log.info(`XNAT: Cleaned instance sample - isReconstructable exists?: ${!!sampleInstance.isReconstructable}`); // Should be false
                }
                DicomMetadataStore.addInstances(instancesToAdd, true);
                console.log('XNAT Study Metadata: Cleaned instances added to DicomMetadataStore');
              } else {
                log.warn('XNAT: No instances found to add to DicomMetadataStore after cleaning.');
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
                } catch (error) {
                  console.error('XNAT: Error adding instances to DicomMetadataStore in batch mode:', error);
                }
              }
            }
            
            // Initialize the metadata provider to help with cornerstone loading
            // Moved this logic inside the loop processing seriesInstancesMap
            /*
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
            */
            
            // Add this code at the appropriate place after the metadata is loaded but before display sets are created
            try {
              const { AppContext } = servicesManager.services;
              if (AppContext && xnatMetadata && xnatMetadata.studies) {
                // Initialize the xnatSeriesMetadata structure if it doesn't exist
                if (!AppContext.xnatSeriesMetadata) {
                  AppContext.xnatSeriesMetadata = {};
                }

                // Store series metadata by StudyInstanceUID for easy lookup
                xnatMetadata.studies.forEach(study => {
                  const studyInstanceUID = study.StudyInstanceUID;
                  
                  // Initialize the study entry if it doesn't exist
                  if (!AppContext.xnatSeriesMetadata[studyInstanceUID]) {
                    AppContext.xnatSeriesMetadata[studyInstanceUID] = {
                      PatientID: study.PatientID,
                      PatientName: study.PatientName,
                      StudyDate: study.StudyDate,
                      StudyTime: study.StudyTime, 
                      StudyDescription: study.StudyDescription,
                      series: []
                    };
                  }

                  // Add all series from this study
                  if (study.series && study.series.length > 0) {
                    study.series.forEach(series => {
                      // Store series with complete metadata
                      const seriesMetadata = {
                        SeriesInstanceUID: series.SeriesInstanceUID,
                        SeriesDescription: series.SeriesDescription || '',
                        SeriesNumber: series.SeriesNumber || '',
                        SeriesDate: series.SeriesDate || study.StudyDate || '',
                        SeriesTime: series.SeriesTime || study.StudyTime || '',
                        Modality: series.Modality || '',
                        // Include study level info for reference
                        StudyInstanceUID: study.StudyInstanceUID,
                        PatientID: study.PatientID,
                        PatientName: study.PatientName,
                        StudyDate: study.StudyDate,
                        StudyTime: study.StudyTime,
                        StudyDescription: study.StudyDescription
                      };

                      // Add to the series array
                      AppContext.xnatSeriesMetadata[studyInstanceUID].series.push(seriesMetadata);
                    });
                  }
                });

              }
            } catch (error) {
              console.error('XNAT: Error storing metadata in AppContext:', error);
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
          throw new Error('XNAT storeInstances failed: wadoDicomWebClient not available');
        }
        
        try {
          // Set the headers for authentication
          wadoDicomWebClient.headers = getAuthorizationHeader();
          console.log('XNAT store dicom: using headers', wadoDicomWebClient.headers);
          
          const naturalizedDatasets = Array.isArray(datasets)
            ? datasets.map(naturalizeDataset)
            : [naturalizeDataset(datasets)];
          
          const denaturalizedDatasets = naturalizedDatasets.map(denaturalizeDataset);
          
          // Attempt to store the instances
          const result = await wadoDicomWebClient.storeInstances({
            datasets: denaturalizedDatasets,
          });
          
          console.log('XNAT store dicom: success', result);
          return result;
        } catch (error) {
          console.error('XNAT store dicom: failed', error);
          throw new Error(`XNAT storeInstances failed: ${error.message || 'unknown error'}`);
        }
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
        
        if (!projectId || !experimentId) {
          console.error('XNAT: Missing projectId or experimentId for metadata fetch');
          return null;
        }
        
        try {
          // Use the wadoRoot from configuration as the base URL
          const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
          
          // Always construct a standardized API URL path
          const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
          
          // Check if baseUrl already contains the XNAT API path
          if (baseUrl.includes('/xapi/viewer/projects/')) {
            
            // Use convertToAbsoluteUrl which now handles path duplication
            const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
            
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
            
            // Get the response as text first to inspect it
            const responseText = await response.text();
            
            // Try to parse it as JSON
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('XNAT: Error parsing JSON response:', parseError);
              console.error('XNAT: Response was not valid JSON. Raw data (first 100 chars):', responseText.substring(0, 100));
              throw new Error('Failed to parse JSON response from XNAT API');
            }
            
            // --- Log the received data --- 
            console.log('XNAT: Raw experiment metadata received from API:', JSON.stringify(data, null, 2)); // Log the parsed data
            // --- End Log ---
            
            return data;
          } else {
            // Normal case - just append the path to the base URL
            const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
            
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
            
            // Get the response as text first to inspect it
            const responseText = await response.text();
            
            // Try to parse it as JSON
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('XNAT: Error parsing JSON response:', parseError);
              console.error('XNAT: Response was not valid JSON. Raw data (first 100 chars):', responseText.substring(0, 100));
              throw new Error('Failed to parse JSON response from XNAT API');
            }
            
            // --- Log the received data --- 
            console.log('XNAT: Raw experiment metadata received from API:', JSON.stringify(data, null, 2)); // Log the parsed data
            // --- End Log ---
            
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
        
        if (!projectId || !subjectId) {
          console.error('XNAT: Missing projectId or subjectId for metadata fetch');
          return null;
        }
        
        try {
          // Use the wadoRoot from configuration as the base URL
          const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
          
          // Construct a standardized API URL path
          const apiPath = `/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
          const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
          
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
        
        if (!projectId) {
          console.error('XNAT: Missing projectId for metadata fetch');
          return null;
        }
        
        try {
          // Use the wadoRoot from configuration as the base URL
          const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
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
export { createXNATApi };

