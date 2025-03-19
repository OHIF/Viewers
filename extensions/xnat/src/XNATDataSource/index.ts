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

import getImageId from '../DicomWebDataSource/utils/getImageId.js';
import dcmjs from 'dcmjs';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from '../DicomWebDataSource/retrieveStudyMetadata.js';
import StaticWadoClient from '../DicomWebDataSource/utils/StaticWadoClient';
import getDirectURL from '../utils/getDirectURL';
import { fixBulkDataURI } from '../DicomWebDataSource/utils/fixBulkDataURI';

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
    log.debug('XNAT: URL already has a scheme, returning as is:', url);
    return url;
  }

  // For HTTP(S) URLs, always use dicomweb: prefix
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const imageId = `dicomweb:${url}`;
    log.debug('XNAT: Formatted absolute URL with dicomweb: scheme:', imageId);
    return imageId;
  }
  
  // For relative URLs that don't have a scheme yet
  if (!url.includes(':')) {
    const imageId = `dicomweb:${url}`;
    log.debug('XNAT: Formatted relative URL with dicomweb: scheme:', imageId);
    return imageId;
  }

  // If already has dicomweb: prefix, return as is
  log.debug('XNAT: URL format preserved:', url);
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
        metadata: async (
          {
            StudyInstanceUID,
            SeriesInstanceUID,
          }: DICOMWebSeriesMetadata,
          enableStudyLazyLoad?: boolean,
          filters?: Record<string, unknown> | Array<Record<string, unknown>>
        ): Promise<DICOMWebSeriesMetadata[]> => {
          log.info('XNAT: retrieve.series.metadata', {
            StudyInstanceUID,
            SeriesInstanceUID,
            enableStudyLazyLoad,
            filters,
          });

          try {
            if (!StudyInstanceUID) {
              throw new Error('No StudyInstanceUID provided - cannot get series metadata');
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

            // Process each series
            return filteredSeriesData.map(series => {
              // Process each instance
              if (series.instances && series.instances.length > 0) {
                series.instances.forEach(instance => {
                  // Use the URL directly from the instance object instead of trying to construct it
                  // The instance object already has a 'url' property with the correct path
                  let instanceURLPath;
                  
                  if (instance.url) {
                    // Use the URL directly from the XNAT API response
                    console.log("XNAT: Using URL from instance:", instance.url);
                    instanceURLPath = instance.url;
                  } else if (instance.scanId && instance.name) {
                    // Fallback to constructing URL if scanId and name are available
                    instanceURLPath = `/data/experiments/${encodeURIComponent(experimentId)}/scans/${encodeURIComponent(instance.scanId)}/resources/DICOM/files/${encodeURIComponent(instance.name)}`;
                    console.log("XNAT: Constructed URL from parts:", instanceURLPath);
                  } else {
                    // Log error if we can't get a valid URL
                    console.error("XNAT: Unable to determine instance URL", instance);
                    return; // Skip this instance
                  }
                  
                  // Make sure we're getting a proper absolute URL based on the XNAT server location
                  const baseUrl = xnatConfig.wadoRoot || window.location.origin;
                  const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                  console.log('XNAT: Instance URL:', absoluteUrl);
                  
                  // Use the appropriate image ID format
                  instance.url = absoluteUrl;
                  instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                  
                  log.debug('XNAT: Instance metadata with imageId:', {
                    url: absoluteUrl,
                    imageId: instance.imageId,
                    scanId: instance.scanId,
                    name: instance.name
                  });

                  // Add to DicomMetadataStore if batch mode is not enabled
                  if (!filters || !(filters as any).batch) {
                    addInstancesToMetadataStore(instance);
                  }
                });
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
              xnatMetadata.studies.forEach(study => {
                if (study.series && study.series.length > 0) {
                  study.series.forEach(series => {
                    processedStudy.series.push(series);
                    processedStudy.seriesMap.set(series.SeriesInstanceUID, series);
                    
                    if (series.instances && series.instances.length > 0) {
                      series.instances.forEach(instance => {
                        // Ensure the url is handled correctly
                        let instanceURLPath;
                        if (instance.url) {
                          // Use the URL directly from the XNAT API response
                          console.log("XNAT: Using URL from instance:", instance.url);
                          instanceURLPath = instance.url;
                        } else if (instance.scanId && instance.name) {
                          // Fallback to constructing URL if scanId and name are available
                          instanceURLPath = `/data/experiments/${encodeURIComponent(experimentId)}/scans/${encodeURIComponent(instance.scanId)}/resources/DICOM/files/${encodeURIComponent(instance.name)}`;
                          console.log("XNAT: Constructed URL from parts:", instanceURLPath);
                        } else {
                          // Log error if we can't get a valid URL
                          console.error("XNAT: Unable to determine instance URL", instance);
                          return; // Skip this instance
                        }
                        
                        // Make sure we're getting a proper absolute URL based on the configuration
                        const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                        console.log('XNAT: Instance URL:', absoluteUrl);
                        
                        // Create properly formatted imageId for Cornerstone using our helper function
                        instance.url = absoluteUrl;
                        instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                        
                        log.debug('XNAT: Instance metadata with imageId:', {
                          url: absoluteUrl,
                          imageId: instance.imageId,
                          scanId: instance.scanId,
                          name: instance.name
                        });
                        
                        const instanceMetadata = {
                          ...series,
                          ...instance.metadata,
                          url: absoluteUrl,
                          StudyInstanceUID: studyUid,
                          // Add the proper imageId for Cornerstone
                          imageId: instance.imageId,
                          // Add important tags for Cornerstone to use
                          Rows: instance.metadata?.Rows || 512,
                          Columns: instance.metadata?.Columns || 512,
                          // Instance Number with fallback
                          InstanceNumber: instance.metadata?.InstanceNumber || '1',
                          // Add custom XNAT properties for debugging
                          xnatProjectId: projectId,
                          xnatExperimentId: experimentId
                        };
                        processedStudy.instances.push(instanceMetadata);
                      });
                    }
                  });
                }
              });
            }
            
            console.log(`XNAT: Processed study with ${processedStudy.series.length} series and ${processedStudy.instances.length} instances`);
            if (processedStudy.instances.length > 0) {
              console.log('XNAT: First instance URL (example):', processedStudy.instances[0]?.url);
              console.log('XNAT: First instance imageId (example):', processedStudy.instances[0]?.imageId);
            }
            
            // Handle batch mode if needed
            const batchMode = options && options.batch === true;
            if (batchMode) {
              // In batch mode, we might need to add all instances to the DicomMetadataStore
              const enableStudyLazyLoad = xnatConfig.enableStudyLazyLoad === undefined ? false : xnatConfig.enableStudyLazyLoad;
              const madeInClient = options && options.madeInClient === true;
              
              if (enableStudyLazyLoad === false && processedStudy.instances.length > 0) {
                try {
                  // Initialize the metadata provider to help with cornerstone loading
                  processedStudy.instances.forEach(instance => {
                    if (instance.SOPInstanceUID && typeof metadataProvider.addInstance === 'function') {
                      metadataProvider.addInstance(instance);
                    }
                  });
                  
                  await DicomMetadataStore.addInstances(processedStudy.instances, madeInClient);
                  console.log('XNAT: Successfully added instances to DicomMetadataStore in batch mode');
                } catch (error) {
                  console.error('XNAT: Error adding instances to DicomMetadataStore in batch mode:', error);
                }
              }
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
        
        // Use the wadoRoot from configuration as the base URL
        const baseUrl = xnatConfig.wadoRoot || 'http://localhost';
        console.log('XNAT: Using base URL from configuration:', baseUrl);
        
        // Always construct a standardized API URL path
        const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
        const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, xnatConfig);
        
        console.log('XNAT: Constructed API URL:', apiUrl);
        
        try {
          const headers = getAuthorizationHeader();
          
          console.log('XNAT: Fetching from URL', apiUrl);
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
          return data;
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
        
        // Construct the URL to the XNAT API endpoint - prevent duplication
        const baseUrl = xnatConfig.wadoRoot || '';
        
        // Check if baseUrl already contains the XNAT API path
        let apiUrl;
        if (baseUrl.includes('/xapi/viewer/projects/')) {
          console.log('XNAT: Base URL already contains the XNAT API path, avoiding duplication');
          
          // If the URL already has a full path, we should use it directly or strip out duplicates
          const parts = baseUrl.split('/xapi/viewer/projects/');
          const basePart = parts[0]; // Get just the protocol and domain
          apiUrl = `${basePart}/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
        } else {
          // Normal case - just append the path to the base URL
          apiUrl = `${baseUrl}/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
        }
        
        console.log('XNAT: Constructed API URL:', apiUrl);
        
        try {
          const headers = getAuthorizationHeader();
          
          console.log('XNAT: Fetching from URL', apiUrl);
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
        
        // Construct the URL to the XNAT API endpoint - prevent duplication
        const baseUrl = xnatConfig.wadoRoot || '';
        
        // Check if baseUrl already contains the XNAT API path
        let apiUrl;
        if (baseUrl.includes('/xapi/viewer/projects/')) {
          console.log('XNAT: Base URL already contains the XNAT API path, avoiding duplication');
          
          // If the URL already has a full path, we should use it directly or strip out duplicates
          const parts = baseUrl.split('/xapi/viewer/projects/');
          const basePart = parts[0]; // Get just the protocol and domain
          apiUrl = `${basePart}/xapi/viewer/projects/${projectId}`;
        } else {
          // Normal case - just append the path to the base URL
          apiUrl = `${baseUrl}/xapi/viewer/projects/${projectId}`;
        }
        
        console.log('XNAT: Constructed API URL:', apiUrl);
        
        try {
          const headers = getAuthorizationHeader();
          
          console.log('XNAT: Fetching from URL', apiUrl);
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

export { createXNATApi };
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
  
  // Log the input for debugging
  console.log('XNAT: Converting URL to absolute:', { relativeUrl, baseUrl });
  
  // If the URL is already absolute, return it as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    console.log('XNAT: URL is already absolute, returning as is:', relativeUrl);
    return relativeUrl;
  }
  
  // Always use the wadoRoot from config if available
  if (config && config.wadoRoot) {
    console.log('XNAT: Using wadoRoot from config:', config.wadoRoot);
    // Make sure the wadoRoot doesn't end with a slash
    const cleanWadoRoot = config.wadoRoot.endsWith('/') ? config.wadoRoot.slice(0, -1) : config.wadoRoot;
    // Make sure the relative URL starts with a slash
    const cleanRelativeUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    const absoluteUrl = `${cleanWadoRoot}${cleanRelativeUrl}`;
    console.log('XNAT: Using configured root - using URL:', absoluteUrl);
    return absoluteUrl;
  }
  
  // If no baseUrl provided and no config.wadoRoot, use window location
  let effectiveBaseUrl = baseUrl || `${window.location.protocol}//${window.location.host}`;
  console.log('XNAT: Using base URL:', effectiveBaseUrl);
  
  // Ensure the relative URL is properly formatted
  // 1. If the relative URL doesn't start with a slash, add one
  let normalizedPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  
  // 2. Make sure we don't end up with double slashes when joining
  if (effectiveBaseUrl.endsWith('/')) {
    effectiveBaseUrl = effectiveBaseUrl.slice(0, -1);
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
 * Add instances to the DicomMetadataStore
 */
const addInstancesToMetadataStore = (instance: any): void => {
  if (!instance) return;
  
  try {
    // Add to DicomMetadataStore
    DicomMetadataStore.addInstances([instance], true);
  } catch (error) {
    log.error('XNAT: Error adding instance to DicomMetadataStore:', error);
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
          allSeries.push(series);
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
