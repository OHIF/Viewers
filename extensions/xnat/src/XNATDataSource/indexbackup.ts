// import { api } from 'dicomweb-client';
// import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler, classes } from '@ohif/core';
// import {
//   mapParams, // From qido.js
//   search as qidoSearch, // From qido.js
//   seriesInStudy, // From qido.js
//   processResults, // From qido.js
//   processSeriesResults, // From qido.js
// } from './qido.js';
// import dcm4cheeReject from '../DicomWebDataSource/dcm4cheeReject.js';
// import { getSOPClassUIDForModality } from './Utils/SOPUtils.js';
// import getImageId from '../DicomWebDataSource/utils/getImageId.js';
// import dcmjs from 'dcmjs';
// import { retrieveStudyMetadata, deleteStudyMetadataPromise } from '../DicomWebDataSource/retrieveStudyMetadata.js';
// import StaticWadoClient from '../DicomWebDataSource/utils/StaticWadoClient.js';
// import getDirectURL from '../utils/getDirectURL.js';
// import { fixBulkDataURI } from '../DicomWebDataSource/utils/fixBulkDataURI.js';
// import { ensureInstanceRequiredFields } from './Utils/instanceUtils.js';
// import { generateRandomUID, extractStudyUIDFromURL } from './Utils/UIDUtils.js';
// import {
//   getXNATStatusFromStudyInstanceUID,
//   getSeriesXNATInstancesMetadata,
//   convertToAbsoluteUrl,
//   setupDisplaySetLogging,
//   // processDataHandler, // Assuming this is from DataSourceUtils, uncomment if used and present
// } from './Utils/DataSourceUtils.js';
// import { default as DICOMWebAliased } from 'dicomweb-client'; // Alias to avoid conflict
// import { api as DICOMWebAPI } from 'dicomweb-client'; 

// const { DicomMetaDictionary, DicomDict } = dcmjs.data;
// const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

// // Define the logger directly
// const log = {
//   debug: (message: string, ...args: any[]) => {
//     console.debug(`XNAT: ${message}`, ...args);
//   },
//   info: (message: string, ...args: any[]) => {
//     console.info(`XNAT: ${message}`, ...args);
//   },
//   warn: (message: string, ...args: any[]) => {
//     console.warn(`XNAT: ${message}`, ...args);
//   },
//   error: (message: string, ...args: any[]) => {
//     console.error(`XNAT: ${message}`, ...args);
//   }
// };

// interface InstanceMetadataForStore {
//   Modality?: string;
//   modality?: string;
//   SOPInstanceUID?: string;
//   StudyInstanceUID?: string;
//   SeriesInstanceUID?: string;
//   SOPClassUID?: string;
//   [key: string]: any; // For other DICOM tags
// }

// /**
//  * Determines the appropriate image loader scheme based on the provided DICOM URL.
//  * @param url - The URL to the DICOM file or DICOMweb endpoint
//  * @param preferredScheme - The preferred scheme to use, defaults to 'wadouri'
//  * @returns A properly formatted imageId string
//  */
// const getAppropriateImageId = (url: string, preferredScheme = 'wadouri'): string => {
//   if (!url) {
//     log.warn('XNAT: Empty URL provided to getAppropriateImageId');
//     return '';
//   }
//   // If URL already has a scheme, respect it
//   if (url.includes(':') && 
//       !url.startsWith('http://') && 
//       !url.startsWith('https://') && 
//       !url.startsWith('dicomweb:')) {
//     return url;
//   }

//   // For HTTP(S) URLs, always use dicomweb: prefix
//   if (url.startsWith('http://') || url.startsWith('https://')) {
//     const imageId = `dicomweb:${url}`;
//     return imageId;
//   }
  
//   // For relative URLs that don't have a scheme yet
//   if (!url.includes(':')) {
//     const imageId = `dicomweb:${url}`;
//     return imageId;
//   }

//   // If already has dicomweb: prefix, return as is
//   return url;
// };

// export type XNATConfig = {
//   /** Data source name */
//   name: string;
//   /** Base URL to use for QIDO requests */
//   qidoRoot?: string;
//   wadoRoot?: string;
//   wadoUri?: string;
//   qidoSupportsIncludeField?: boolean;
//   imageRendering?: string;
//   thumbnailRendering?: string;
//   /** Whether the server supports reject calls */
//   supportsReject?: boolean;
//   /** Request series meta async instead of blocking */
//   lazyLoadStudy?: boolean;
//   /** Indicates if the retrieves can fetch singlepart. Options are bulkdata, video, image, or true */
//   singlepart?: boolean | string;
//   /** Transfer syntax to request from the server */
//   requestTransferSyntaxUID?: string;
//   acceptHeader?: string[];
//   /** Whether to omit quotation marks for multipart requests */
//   omitQuotationForMultipartRequest?: boolean;
//   /** Whether the server supports fuzzy matching */
//   supportsFuzzyMatching?: boolean;
//   /** Whether the server supports wildcard matching */
//   supportsWildcard?: boolean;
//   /** Whether the server supports the native DICOM model */
//   supportsNativeDICOMModel?: boolean;
//   /** Whether to enable request tag */
//   enableRequestTag?: boolean;
//   /** Whether to enable study lazy loading */
//   enableStudyLazyLoad?: boolean;
//   /** Whether to enable bulkDataURI */
//   bulkDataURI?: {
//     enabled?: boolean;
//     startsWith?: string;
//     prefixWith?: string;
//     transform?: (uri: string) => string;
//     relativeResolution?: 'studies' | 'series';
//   };
//   /** Function that is called after the configuration is initialized */
//   onConfiguration: (config: XNATConfig, params) => XNATConfig;
//   /** Whether to use the static WADO client */
//   staticWado?: boolean;
//   /** User authentication service */
//   userAuthenticationService: Record<string, unknown>;
//   /** XNAT specific configuration */
//   xnat?: {
//     projectId?: string;
//     subjectId?: string;
//     sessionId?: string;
//     experimentId?: string;
//   };
// };

// /**
//  * Creates an XNAT API based on the provided configuration.
//  *
//  * @param xnatConfig - Configuration for the XNAT API
//  * @returns XNAT API object
//  */
// function createXNATApi(xnatConfig: XNATConfig, servicesManager) {
//   const { userAuthenticationService } = servicesManager.services;
//   let qidoConfig, wadoConfig, qidoDicomWebClient, wadoDicomWebClient, dicomWebConfigCopy;
  
//   console.log('XNAT createXNATApi - Initializing');
  
//   // Define getAuthorizationHeader and generateWadoHeader in this scope
//   const getAuthorizationHeader = () => {
//     console.log('XNAT getAuthorizationHeader');
//     try {
//       const xhrRequestHeaders: Record<string, string> = {};
//       if (userAuthenticationService?.getAuthorizationHeader) {
//         const authHeaders = userAuthenticationService.getAuthorizationHeader();
//         if (authHeaders && authHeaders.Authorization) {
//           xhrRequestHeaders.Authorization = authHeaders.Authorization;
//         }
//       }
//       return xhrRequestHeaders;
//     } catch (e) {
//       console.warn('Error in getAuthorizationHeader:', e);
//       return {};
//     }
//   };

//   const generateWadoHeader = () => {
//     console.log('XNAT generateWadoHeader');
//     const authorizationHeader = getAuthorizationHeader();
//     const formattedAcceptHeader = utils.generateAcceptHeader(
//       xnatConfig.acceptHeader, // Use xnatConfig here as dicomWebConfigCopy might not be set yet
//       xnatConfig.requestTransferSyntaxUID,
//       xnatConfig.omitQuotationForMultipartRequest
//     );
//     return {
//       ...authorizationHeader,
//       Accept: formattedAcceptHeader,
//     };
//   };

//   // Default to enabling bulk data retrieves
//   xnatConfig.bulkDataURI ||= { enabled: true };
//   console.log('xnatConfig at start of createXNATApi:', xnatConfig);
  
//   const getConfig = () => dicomWebConfigCopy || xnatConfig; // Prefer dicomWebConfigCopy if available
  
//   const xnatApiMethods = {
//     getExperimentMetadata: async (projectId, experimentId) => {
//       const currentConfig = dicomWebConfigCopy || xnatConfig; // Use the most relevant config
//       log.info(`XNATDataSource: xnat.getExperimentMetadata attempting for ${projectId}/${experimentId} with URL ${currentConfig.wadoRoot}`);
//       const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
//       const baseUrl = currentConfig.wadoRoot || 'http://localhost';
//       const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
//       const headers = getAuthorizationHeader(); 
//       log.info(`XNATDataSource: Fetching from apiUrl: ${apiUrl}`);
//       try {
//         const response = await fetch(apiUrl, {
//           method: 'GET',
//           headers: { 'Accept': 'application/json', ...headers },
//         });

//         log.info(`XNATDataSource: Received response from ${apiUrl} - Status: ${response.status}, StatusText: ${response.statusText}, OK: ${response.ok}`);

//         if (!response.ok) {
//           const errorText = await response.text(); // Attempt to get error body
//           log.error(`XNAT API error fetching experiment ${experimentId}: ${response.status} ${response.statusText}. Body: ${errorText}`);
//           throw new Error(`XNAT API error: ${response.status} ${response.statusText}. Body: ${errorText}`);
//         }

//         // Try to parse JSON, and catch if it fails
//         let data;
//         try {
//           data = await response.json();
//           log.info(`XNATDataSource: xnat.getExperimentMetadata successfully parsed JSON for ${experimentId}:`, data);
//         } catch (jsonError) {
//           log.error(`XNATDataSource: Failed to parse JSON response for ${experimentId}. URL: ${apiUrl}, Status: ${response.status}. Error:`, jsonError);
//           const responseText = await response.text(); // Log the raw text response if JSON parsing fails
//           log.error(`XNATDataSource: Raw response text for ${experimentId}: ${responseText}`);
//           throw jsonError; // Re-throw the JSON parsing error
//         }
//         return data; 
//       } catch (fetchError) {
//         // This catches network errors or errors thrown from the !response.ok block or jsonError processing
//         log.error(`XNATDataSource: Error during fetch or processing for ${experimentId}. URL: ${apiUrl}. Error:`, fetchError);
//         throw fetchError; // Re-throw to be caught by the caller (retrieveSeriesMetadataAsync)
//       }
//     },
//     getProjectMetadata: async (projectId) => { /* placeholder */ },
//     getSubjectMetadata: async (projectId, subjectId) => { /* placeholder */ },
//   };

//   const implementation = {
//     initialize: ({ params, query }) => {
//       console.log('XNATDataSource: initialize started. Initial xnatConfig:', JSON.parse(JSON.stringify(xnatConfig)));
//       console.log('XNATDataSource: initialize params:', params);
//       console.log('XNATDataSource: initialize query:', query);

//       setupDisplaySetLogging();
//       console.log('XNAT: Display set logging initialized');
      
//       xnatConfig.xnat = xnatConfig.xnat || {};
      
//       const queryProjectId = params?.projectId || query?.get('projectId');
//       const queryExperimentId = params?.experimentId || query?.get('experimentId');
//       const querySessionId = params?.sessionId || query?.get('sessionId');
//       const querySubjectId = params?.subjectId || query?.get('subjectId');
      
//       if (queryProjectId) xnatConfig.xnat.projectId = queryProjectId;
//       if (queryExperimentId) xnatConfig.xnat.experimentId = queryExperimentId;
//       if (querySessionId) xnatConfig.xnat.sessionId = querySessionId;
//       if (querySubjectId) xnatConfig.xnat.subjectId = querySubjectId;
      
//       console.log('XNAT IDs extracted and stored in xnatConfig.xnat:', xnatConfig.xnat);
      
//       if (xnatConfig.onConfiguration && typeof xnatConfig.onConfiguration === 'function') {
//         console.log('XNATDataSource: Calling onConfiguration.');
//         xnatConfig = xnatConfig.onConfiguration(xnatConfig, { params, query });
//         console.log('XNATDataSource: xnatConfig after onConfiguration:', JSON.parse(JSON.stringify(xnatConfig)));
//       }

//       dicomWebConfigCopy = JSON.parse(JSON.stringify(xnatConfig));
//       console.log('XNATDataSource: dicomWebConfigCopy created:', JSON.parse(JSON.stringify(dicomWebConfigCopy)));

//       qidoConfig = {
//         url: dicomWebConfigCopy.qidoRoot,
//         staticWado: dicomWebConfigCopy.staticWado,
//         singlepart: dicomWebConfigCopy.singlepart,
//         headers: getAuthorizationHeader(), // Use refreshed auth header
//         errorInterceptor: errorHandler.getHTTPErrorHandler(),
//         supportsFuzzyMatching: dicomWebConfigCopy.supportsFuzzyMatching,
//       };
      
//       wadoConfig = {
//         url: dicomWebConfigCopy.wadoRoot,
//         staticWado: dicomWebConfigCopy.staticWado,
//         singlepart: dicomWebConfigCopy.singlepart,
//         headers: getAuthorizationHeader(), // Use refreshed auth header     
//         errorInterceptor: errorHandler.getHTTPErrorHandler(),
//         supportsFuzzyMatching: dicomWebConfigCopy.supportsFuzzyMatching,
//       };
      
//       console.log('Initializing XNAT DICOMweb clients with QIDO config:', qidoConfig, 'WADO config:', wadoConfig);
//       try {
//         qidoDicomWebClient = dicomWebConfigCopy.staticWado
//           ? new StaticWadoClient(qidoConfig)
//           : new api.DICOMwebClient(qidoConfig);
//         console.log('XNAT qidoDicomWebClient initialized.');
//       } catch (error) {
//         console.error('Error initializing XNAT qido DICOMweb client:', error);
//       }

//       try {
//         wadoDicomWebClient = dicomWebConfigCopy.staticWado
//           ? new StaticWadoClient(wadoConfig)
//           : new api.DICOMwebClient(wadoConfig);
//         console.log('XNAT wadoDicomWebClient initialized.');
//       } catch (error) {
//         console.error('Error initializing XNAT wado DICOMweb client:', error);
//       }
//       console.log('XNATDataSource: initialize completed.');
//     },
    
//     query: {
//       studies: {
//         mapParams: mapParams.bind({}), // Consider if mapParams needs config
//         search: async function (origParams) {
//           // Extract study instance UID from params
//           let studyInstanceUid = origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
//           // If no studyInstanceUid directly provided, check if it's in a nested object
//           if (!studyInstanceUid && typeof origParams === 'object' && origParams !== null) {
//             if (origParams.studyInstanceUid) {
//               studyInstanceUid = origParams.studyInstanceUid;
//             }
//           }
          
//           // Extract XNAT identifiers using the helper function
//           const { projectId, experimentId } = getXNATStatusFromStudyInstanceUID(studyInstanceUid, xnatConfig);
          
//           console.log('XNAT study search using:', { projectId, experimentId, studyInstanceUid });
          
//           if (!projectId || !experimentId) {
//             console.error('XNAT: Missing projectId or experimentId for metadata fetch in search');
//             console.error('XNAT: Please provide these values in URL parameters or configuration');
//             return [];
//           }
          
//           try {
//             // Use the xnatApiMethods defined in the outer scope
//             const xnatMetadata = await xnatApiMethods.getExperimentMetadata(projectId, experimentId);
            
//             if (!xnatMetadata || !xnatMetadata.studies || !xnatMetadata.studies.length) {
//               console.error('XNAT: No valid metadata returned from XNAT API in search');
//               return [];
//             }
            
//             // Convert XNAT metadata format to QIDO-RS format that the viewer expects
//             const results = [];
            
//             xnatMetadata.studies.forEach(study => {
//               // Create a result object in QIDO-RS format
//               const result = {
//                 "00080020": { vr: "DA", Value: [study.StudyDate || ""] },
//                 "00080030": { vr: "TM", Value: [study.StudyTime || ""] },
//                 "00080050": { vr: "SH", Value: [study.AccessionNumber || ""] },
//                 "00080054": { vr: "AE", Value: [xnatConfig.qidoRoot || ""] },
//                 "00080056": { vr: "CS", Value: ["ONLINE"] },
//                 "00080061": { vr: "CS", Value: study.Modalities},
//                 "00080090": { vr: "PN", Value: [{ Alphabetic: study.ReferringPhysicianName || "" }] },
//                 "00081190": { vr: "UR", Value: [xnatConfig.qidoRoot || ""] },
//                 "00100010": { vr: "PN", Value: [{ Alphabetic: study.PatientName || "Anonymous" }] },
//                 "00100020": { vr: "LO", Value: [study.PatientID || ""] },
//                 "00100030": { vr: "DA", Value: [study.PatientBirthDate || ""] },
//                 "00100040": { vr: "CS", Value: [study.PatientSex || ""] },
//                 // Ensure the StudyInstanceUID matches the one used for the query if available
//                 "0020000D": { vr: "UI", Value: [studyInstanceUid || study.StudyInstanceUID || xnatMetadata.transactionId] },
//                 "00200010": { vr: "SH", Value: [study.StudyID || ""] },
//                 "00081030": { vr: "LO", Value: [study.StudyDescription || "XNAT Study"] }
//               };
              
//               // Add series count
//               if (study.series && study.series.length) {
//                 result["00201206"] = { vr: "IS", Value: [study.series.length.toString()] };
                
//                 // Get modalities from series
//                 const modalities = new Set<string>(); // Use Set<string>
//                 study.series.forEach(series => {
//                   if (series.Modality) {
//                     modalities.add(series.Modality);
//                   }
//                 });
                
//                 if (modalities.size > 0) {
//                   result["00080061"].Value = Array.from(modalities);
//                 }
//               }
              
//               results.push(result);
//             });
            
//             return results;
//           } catch (error) {
//             console.error('XNAT: Error in study search:', error);
            
//             // Fall back to traditional DICOMweb search as a last resort
//             console.warn('XNAT: Falling back to DICOMweb search (likely to fail if XNAT does not support DICOMweb)');
            
//             // Check client exists
//             if (!qidoDicomWebClient) {
//               console.error('qidoDicomWebClient not available - search may fail');
//               return [];
//             }
            
//             qidoDicomWebClient.headers = getAuthorizationHeader();
            
//             // Fix for StudyInstanceUID case differences
//             if (origParams?.StudyInstanceUID && !origParams?.studyInstanceUID) {
//               origParams.studyInstanceUID = origParams.StudyInstanceUID;
//             }
            
//             // Define paramMap type explicitly and ensure origParams is an object
//             const validOrigParams = typeof origParams === 'object' && origParams !== null ? origParams : {};
//             // Ensure the result of mapParams is treated as an object
//             const mappedResult = mapParams(validOrigParams, {
//               supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
//               supportsWildcard: xnatConfig.supportsWildcard,
//             });
//             const paramMap: Record<string, any> = typeof mappedResult === 'object' && mappedResult !== null ? mappedResult : {};
            
//             // Extract study and series UIDs separately to avoid destructuring issues
//             const queryStudyInstanceUid = paramMap.studyInstanceUID || origParams?.studyInstanceUID || origParams?.StudyInstanceUID;
//             const querySeriesInstanceUid = paramMap.seriesInstanceUID;
            
//             // Remove these properties to prevent duplicate parameters
//             delete paramMap.studyInstanceUID;
//             delete paramMap.seriesInstanceUID;

//             const results = await qidoSearch(qidoDicomWebClient, queryStudyInstanceUid, querySeriesInstanceUid, paramMap);
//             console.log('XNAT study search: results', results);
//             return processResults(results);
//           }
//         },
//       },
      
//       series: {
//         search: async function (studyInstanceUID, filters) {
//           if (!qidoDicomWebClient) {
//             console.error('qidoDicomWebClient not available - series search may fail');
//             return [];
//           }
//           qidoDicomWebClient.headers = getAuthorizationHeader();
          
//           // Ensure studyInstanceUID is a string
//           if (typeof studyInstanceUID !== 'string') {
//             console.warn('XNAT series search: studyInstanceUID is not a string', studyInstanceUID);
//             if (studyInstanceUID?.StudyInstanceUID) {
//               studyInstanceUID = studyInstanceUID.StudyInstanceUID;
//             } else if (studyInstanceUID?.studyInstanceUID) {
//               studyInstanceUID = studyInstanceUID.studyInstanceUID;
//             } else {
//               console.error('XNAT series search: Unable to determine studyInstanceUID');
//               return [];
//             }
//           } else {
//             studyInstanceUID = studyInstanceUID;
//           }
          
//           const mappedFilters = mapParams(filters, {
//             supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
//             supportsWildcard: xnatConfig.supportsWildcard,
//           });
          
//           console.log('XNAT series search: using studyInstanceUID', studyInstanceUID);
//           console.log('XNAT series search: mapped filters', mappedFilters);
          
//           try {
//             // Call seriesInStudy with the correct number of arguments
//             // The seriesInStudy function expects (client, studyInstanceUid) params
//             const results = await seriesInStudy(qidoDicomWebClient, studyInstanceUID);
//             console.log('XNAT series search: results', results);
//             return processSeriesResults(results);
//           } catch (error) {
//             console.error('XNAT series search error:', error);
//             return [];
//           }
//         },
//       },
      
//       instances: {
//         search: async function (studyInstanceUID, seriesInstanceUID, filters) {
//           console.log('XNAT instances search');
//           if (!qidoDicomWebClient) {
//             console.error('qidoDicomWebClient not available - instances search may fail');
//             return [];
//           }
//           qidoDicomWebClient.headers = getAuthorizationHeader();
          
//           const mappedFilters = mapParams(filters, {
//             supportsFuzzyMatching: xnatConfig.supportsFuzzyMatching,
//             supportsWildcard: xnatConfig.supportsWildcard,
//           });
          
//           const results = await qidoDicomWebClient.searchForInstances({
//             studyInstanceUID,
//             seriesInstanceUID,
//             queryParams: mappedFilters,
//           });
          
//           return results.map(instance => naturalizeDataset(instance));
//         },
//       },
//     },
    
//     retrieve: {
//       bulkDataURI: function(value, instance) {
//         // Only call fixBulkDataURI if we have a valid config with bulkDataURI settings
//         if (xnatConfig && value && instance) {
//           return fixBulkDataURI(value, instance, xnatConfig);
//         }
//         // Return the value unmodified if config or instance is missing
//         return value;
//       },
      
//       series: {
//         metadata: async ({
//           StudyInstanceUID,
//           filters, // Added filters
//           sortCriteria, // Added sortCriteria
//           sortFunction, // Added sortFunction
//           madeInClient = false,
//           returnPromises = false,
//         }: {
//           StudyInstanceUID: string;
//           filters?: Record<string, any>; // Typed filters
//           sortCriteria?: any; // Typed sortCriteria
//           sortFunction?: (...args: any[]) => number; // Typed sortFunction
//           madeInClient?: boolean;
//           returnPromises?: boolean;
//         }) => {
//           if (!StudyInstanceUID) {
//             log.error('XNAT: retrieve.series.metadata - Missing StudyInstanceUID');
//             return Promise.reject(new Error('Missing StudyInstanceUID'));
//           }

//           log.info(
//             `XNAT: retrieve.series.metadata for StudyInstanceUID: ${StudyInstanceUID}, returnPromises: ${returnPromises}, madeInClient: ${madeInClient}`
//           );

//           const retrieveSeriesMetadataAsync = async () => {
//             log.info(`XNAT: retrieveSeriesMetadataAsync called for StudyUID: ${StudyInstanceUID}`);
//             let seriesAndInstances;
//             try {
//               // Ensure dicomWebConfigCopy is available; it should be as initialize runs before this.
//               if (!dicomWebConfigCopy) {
//                 log.error('XNAT: dicomWebConfigCopy is not available in retrieveSeriesMetadataAsync. وهذا أمر غير متوقع.');
//                 // Fallback to xnatConfig, though this indicates a potential flow issue.
//                 dicomWebConfigCopy = xnatConfig;
//               }
//               seriesAndInstances = await implementation.xnat.getExperimentMetadata(dicomWebConfigCopy.xnat.projectId, dicomWebConfigCopy.xnat.experimentId);
//               log.info(`XNAT: Fetched experiment metadata for ${StudyInstanceUID}`, seriesAndInstances);
//             } catch (e) {
//               log.error(
//                 `XNAT: Error fetching experiment metadata for StudyInstanceUID ${StudyInstanceUID}: `,
//                 e
//               );
//               throw e;
//             }

//             if (!seriesAndInstances || !seriesAndInstances.studies || seriesAndInstances.studies.length === 0) {
//               log.warn(`XNAT: No studies found in experiment metadata for StudyInstanceUID ${StudyInstanceUID}`);
//               return [];
//             }

//             const study = seriesAndInstances.studies.find(s => s.StudyInstanceUID === StudyInstanceUID);
//             if (!study || !study.series || study.series.length === 0) {
//               log.warn(`XNAT: No series found for StudyInstanceUID ${StudyInstanceUID} within the experiment data.`);
//               return [];
//             }

//             log.info(`XNAT: retrieve.series.metadata - Found ${study.series.length} series in XNAT experiment for StudyUID ${StudyInstanceUID}`);

//             const allNaturalizedInstancesForStudy = []; // Collect all naturalized instances for the return value

//             for (const series of study.series) {
//               log.info(`XNAT: retrieveSeriesMetadataAsync - Iterating series: ${series.SeriesInstanceUID}`);
//               const xnatInstances = series.instances || [];
//               if (xnatInstances.length === 0) {
//                 log.warn(`XNAT: No instances for series ${series.SeriesInstanceUID}`);
//                 continue;
//               }

//               const naturalizedInstancesForThisSeries = [];
//               const instancesToStoreForThisSeries = [];

//               xnatInstances.forEach(xnatInstance => {
//                 const xnatMeta = xnatInstance.metadata || {};
//                 const determinedModality = series.Modality || xnatMeta.Modality || 'Unknown';
                
//                 log.info(`XNAT: retrieveSeriesMetadataAsync - Instance Processing - SeriesUID: ${series.SeriesInstanceUID}, SOPInstanceUID from xnatMeta: ${xnatMeta.SOPInstanceUID}`);
//                 log.info(`XNAT: retrieveSeriesMetadataAsync - Instance Processing - series.Modality: ${series.Modality}, xnatMeta.Modality: ${xnatMeta.Modality}, determinedModality: ${determinedModality}`);

//                 const naturalized = {
//                   StudyInstanceUID,
//                   SeriesInstanceUID: series.SeriesInstanceUID,
//                   SOPInstanceUID: xnatMeta.SOPInstanceUID || generateRandomUID(), // Added UID generation as fallback
//                   Modality: determinedModality, // Uppercase Modality
//                   modality: determinedModality, // ensure lowercase modality is also present
//                   imageId: getAppropriateImageId(dicomWebConfigCopy.wadoRoot + xnatInstance.url, dicomWebConfigCopy.imageRendering),
//                   ...(xnatMeta as any),
//                   SOPClassUID: xnatMeta.SOPClassUID || getSOPClassUIDForModality(determinedModality),
//                   InstanceNumber: xnatMeta.InstanceNumber || (naturalizedInstancesForThisSeries.length + 1).toString(), // Add fallback for instance number
//                   Rows: xnatMeta.Rows || 512,
//                   Columns: xnatMeta.Columns || 512,
//                   PixelSpacing: xnatMeta.PixelSpacing || [1, 1],
//                   SliceThickness: xnatMeta.SliceThickness || 1,
//                   ImagePositionPatient: xnatMeta.ImagePositionPatient || [0,0,naturalizedInstancesForThisSeries.length],
//                   ImageOrientationPatient: xnatMeta.ImageOrientationPatient || [1,0,0,0,1,0],
//                   ImageType: xnatMeta.ImageType || 'ORIGINAL',
//                   NumberOfFrames: xnatMeta.NumberOfFrames || '1',
//                 };
                
//                 log.info(`XNAT: retrieveSeriesMetadataAsync - Naturalized object created. Has Modality (uppercase): ${naturalized.Modality}, Has modality (lowercase): ${naturalized.modality}`);

//                 naturalizedInstancesForThisSeries.push(naturalized);
//                 allNaturalizedInstancesForStudy.push(naturalized);

//                 // Create a new object for denaturalization, excluding non-DICOM properties.
//                 // The primary one here is 'imageId', which is not a DICOM keyword.
//                 const dicomDatasetToDenaturalize = { ...naturalized };
//                 delete dicomDatasetToDenaturalize.imageId;
//                 delete dicomDatasetToDenaturalize.modality; // Remove lowercase modality before denaturalization
//                 // If other non-DICOM keys are known to be in `naturalized` (e.g. from `xnatMeta`),
//                 // they should also be deleted here.

//                 const storable = {
//                   ...denaturalizeDataset(dicomDatasetToDenaturalize), 
//                   StudyInstanceUID,
//                   SeriesInstanceUID: series.SeriesInstanceUID,
//                   SOPInstanceUID: naturalized.SOPInstanceUID,
//                   Modality: determinedModality, // Uppercase Modality
//                   modality: determinedModality, // lowercase modality
//                   SOPClassUID: naturalized.SOPClassUID,
//                   InstanceNumber: naturalized.InstanceNumber,
//                   url: naturalized.imageId.startsWith('dicomweb:') ? naturalized.imageId.substring(9) : naturalized.imageId,
//                   imageId: naturalized.imageId,
//                   Rows: naturalized.Rows,
//                   Columns: naturalized.Columns,
//                   PixelSpacing: naturalized.PixelSpacing,
//                   SliceThickness: naturalized.SliceThickness,
//                   ImagePositionPatient: naturalized.ImagePositionPatient,
//                   ImageOrientationPatient: naturalized.ImageOrientationPatient,
//                   ImageType: naturalized.ImageType,
//                   NumberOfFrames: naturalized.NumberOfFrames,
//                 };
                
//                 log.info(`XNAT: retrieveSeriesMetadataAsync - Storable object created. Has Modality (uppercase): ${storable.Modality}, Has modality (lowercase): ${storable.modality}, SOPInstanceUID: ${storable.SOPInstanceUID}`);
//                 instancesToStoreForThisSeries.push(storable);
//               });

//               if (instancesToStoreForThisSeries.length > 0) {
//                  log.info(`XNAT:retrieveSeriesMetadataAsync - Preparing to store ${instancesToStoreForThisSeries.length} instances for series ${series.SeriesInstanceUID}. Sample instance (imageId, modality):`, { imageId: instancesToStoreForThisSeries[0]?.imageId, modality: instancesToStoreForThisSeries[0]?.modality, sopUID: instancesToStoreForThisSeries[0]?.SOPInstanceUID });
//                  log.info(`XNAT:retrieveSeriesMetadataAsync - Storing ${instancesToStoreForThisSeries.length} processed instances in DicomMetadataStore for series ${series.SeriesInstanceUID} (Study ${StudyInstanceUID})`);
//                  DicomMetadataStore.addInstances(instancesToStoreForThisSeries, madeInClient); // Add instances PER SERIES
//               }
//             }
            
//             // DicomMetadataStore.addInstances calls are now inside the per-series loop.
//             // The function returns all naturalized instances combined from all series for this study.
//             log.info(`XNAT: retrieveSeriesMetadataAsync - Returning ${allNaturalizedInstancesForStudy.length} total naturalized instances for study ${StudyInstanceUID}`);
//             return allNaturalizedInstancesForStudy;
//           };

//           if (returnPromises) {
//             // Wrap the async function in an object that mimics a promise with a start method
//             const promiseLike = {
//               _promise: null,
//               start: function() {
//                 if (!this._promise) {
//                   this._promise = retrieveSeriesMetadataAsync();
//                 }
//                 return this._promise;
//               },
//               then: function(onFulfilled, onRejected) {
//                 if (!this._promise) {
//                   this.start(); // Ensure the async operation is started
//                 }
//                 return this._promise.then(onFulfilled, onRejected);
//               },
//               catch: function(onRejected) {
//                 if (!this._promise) {
//                   this.start(); // Ensure the async operation is started
//                 }
//                 return this._promise.catch(onRejected);
//               }
//             };
//             return [promiseLike];
//           } else {
//             return retrieveSeriesMetadataAsync();
//           }
//         },
//       },
      
//       study: {
//         // Define interface for options
//         metadata: async function (studyInstanceUID, options: { batch?: boolean; madeInClient?: boolean } = {}) {
//           console.log('XNAT retrieve study metadata', {studyInstanceUID});
          
//           // Add diagnostic logs to help debug the call context
//           log.info('XNAT: study.metadata called with:', {
//             studyInstanceUID,
//             options,
//             stack: new Error().stack,
//             config: xnatConfig,
//             timestamp: new Date().toISOString()
//           });
          
//           // Handle studyInstanceUID when it's an object (common case)
//           let studyUid = studyInstanceUID;
//           if (typeof studyInstanceUID === 'object' && studyInstanceUID !== null) {
//             if (studyInstanceUID.StudyInstanceUID) {
//               studyUid = studyInstanceUID.StudyInstanceUID;
//               console.log('XNAT: Extracted StudyInstanceUID from object:', studyUid);
//             } else {
//               console.error('XNAT: studyInstanceUID is an object but missing StudyInstanceUID property');
//               return null;
//             }
//           }
          
//           // Extract XNAT identifiers from configuration 
//           let projectId = xnatConfig.xnat?.projectId;
//           let experimentId = xnatConfig.xnat?.experimentId || xnatConfig.xnat?.sessionId;
          
//           // If we don't have project and experiment IDs in config, try to derive them
//           if (!projectId || !experimentId) {
            
//             // Check URL for study or experiment ID parameters
//             const urlParams = new URLSearchParams(window.location.search);
            
//             // Look for alternative parameter names in URL
//             const possibleProjectParams = ['projectId', 'project', 'proj'];
//             const possibleExperimentParams = ['experimentId', 'experiment', 'session', 'exam', 'scan'];
            
//             for (const param of possibleProjectParams) {
//               const value = urlParams.get(param);
//               if (value) {
//                 projectId = value;
//                 console.log(`XNAT: Found project ID in URL parameter '${param}': ${projectId}`);
//                 break;
//               }
//             }
            
//             for (const param of possibleExperimentParams) {
//               const value = urlParams.get(param);
//               if (value) {
//                 experimentId = value;
//                 console.log(`XNAT: Found experiment ID in URL parameter '${param}': ${experimentId}`);
//                 break;
//               }
//             }
            
//             // If we still don't have project/experiment IDs, try to derive from StudyInstanceUID
//             if ((!projectId || !experimentId) && studyUid) {
              
//               if (!experimentId) {
//                 experimentId = studyUid;
//               }
              
//               if (!projectId) {
//                 projectId = "defaultProject";
//               }
//             }
//           }
          
          
//           if (!projectId || !experimentId) {
//             console.error('XNAT: Missing projectId or experimentId for metadata fetch');
//             console.error('XNAT: Please provide these values in URL parameters or configuration');
//             return null;
//           }
          
//           try {
//             // Use the XNAT-specific method to get experiment metadata
//             const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
            
//             if (!xnatMetadata) {
//               console.error('XNAT: No metadata returned from XNAT API');
//               return null;
//             }
            
//             console.log('XNAT: Successfully retrieved study metadata from XNAT API');
            
//             // Get the base URL for constructing absolute URLs
//             let baseUrl = '';
//             try {
//               if (typeof xnatConfig.wadoRoot === 'string' && xnatConfig.wadoRoot) {
//                 const url = new URL(xnatConfig.wadoRoot);
//                 baseUrl = `${url.protocol}//${url.host}`;
//               } else {
//                 // Fallback to window location
//                 baseUrl = `${window.location.protocol}//${window.location.host}`;
//               }
//             } catch (error) {
//               console.error('XNAT: Error parsing URL, using window location', error);
//               baseUrl = `${window.location.protocol}//${window.location.host}`;
//             }
            
//             // Create a basic study object first
//             const studyMetadataForStore = {
//               StudyInstanceUID: studyUid,
//               PatientID: xnatMetadata.studies?.[0]?.PatientID || 'Unknown',
//               PatientName: xnatMetadata.studies?.[0]?.PatientName || 'Unknown',
//               StudyDate: xnatMetadata.studies?.[0]?.StudyDate || '',
//               StudyTime: xnatMetadata.studies?.[0]?.StudyTime || '',
//               AccessionNumber: xnatMetadata.studies?.[0]?.AccessionNumber || '',
//               ReferringPhysicianName: xnatMetadata.studies?.[0]?.ReferringPhysicianName || '',
//               PatientBirthDate: xnatMetadata.studies?.[0]?.PatientBirthDate || '',
//               PatientSex: xnatMetadata.studies?.[0]?.PatientSex || '',
//               StudyID: xnatMetadata.studies?.[0]?.StudyID || '',
//               StudyDescription: xnatMetadata.studies?.[0]?.StudyDescription || 'XNAT Study',
//               // IMPORTANT: Store wadoRoot directly in the study metadata
//               wadoRoot: xnatConfig.wadoRoot,
//               ModalitiesInStudy: [], // Will be populated later
//               NumInstances: 0, // Will be populated later
//               NumSeries: 0, // Will be populated later
//               // Add other relevant top-level study tags if available from xnatMetadata
//               // Store the raw XNAT transaction details if needed
//               xnatTransactionId: xnatMetadata.transactionId, 
//             };
            
//             // Add or update this study metadata in the DicomMetadataStore immediately
//             // This ensures wadoRoot is present when series/instances are added later
//             DicomMetadataStore.addStudy(studyMetadataForStore);
//             log.info(`XNAT: Added/Updated study ${studyUid} in DicomMetadataStore with wadoRoot: ${studyMetadataForStore.wadoRoot}`);
            
//             // Use this stored metadata object for further processing
//             const processedStudy = {
//               ...studyMetadataForStore, // Start with the stored metadata
//               series: [],
//               seriesMap: new Map(),
//               instances: [],
//               // Keep the original raw metadata if needed elsewhere
//               rawMetadata: xnatMetadata, 
//             };
            
//             // XNAT API returns data in a specific structure we need to process
//             if (xnatMetadata.studies && xnatMetadata.studies.length > 0) {
//               // Group instances by SeriesInstanceUID for proper batching
//               const seriesInstancesMap = new Map();
              
//               xnatMetadata.studies.forEach(study => {
//                 if (study.series && study.series.length > 0) {
//                   study.series.forEach((series, index) => {
//                     // We no longer generate displaySetInstanceUID here
//                     // Let the ImageSet class handle this during display set creation
//                     log.info(`XNAT: retrieve.study.metadata - Processing series UID: ${series.SeriesInstanceUID}, Series Modality from XNAT: ${series.Modality}`);        
//                     // Make sure each series has critical properties needed for proper grouping
//                     const enhancedSeries = {
//                       ...series,
//                       Modality: series.Modality || 'CT',
//                       SeriesDescription: series.SeriesDescription || 'XNAT Series',
//                       SeriesNumber: series.SeriesNumber || '1',
//                       SeriesDate: series.SeriesDate || study.StudyDate || '',
//                       SeriesTime: series.SeriesTime || study.StudyTime || '',
//                       // Critical for display set creation
//                       isMultiFrame: false,
//                       isReconstructable: true,
//                       StudyInstanceUID: studyUid
//                       // We no longer set displaySetInstanceUID here
//                     };
                    
//                     processedStudy.series.push(enhancedSeries);
//                     processedStudy.seriesMap.set(series.SeriesInstanceUID, enhancedSeries);
                    
//                     // Initialize an array for this series in our map if needed
//                     if (!seriesInstancesMap.has(series.SeriesInstanceUID)) {
//                       seriesInstancesMap.set(series.SeriesInstanceUID, []);
//                     }
                    
//                     if (series.instances && series.instances.length > 0) {
//                       // Sort instances numerically by instance number if available
//                       const sortedInstances = [...series.instances].sort((a, b) => {
//                         const aNum = parseInt(a.metadata?.InstanceNumber || '0');
//                         const bNum = parseInt(b.metadata?.InstanceNumber || '0');
//                         return aNum - bNum;
//                       });
                      
//                       // Process instances and collect them by series
//                       const seriesProcessedInstances = [];
                      
//                       sortedInstances.forEach((instance, index) => {
//                         // Ensure the url is handled correctly
//                         let instanceURLPath;
//                         log.info(`XNAT: retrieve.study.metadata - For instance ${index} in series ${series.SeriesInstanceUID}, series.Modality is: ${series.Modality}, raw instance.metadata.Modality is: ${instance.metadata?.Modality}`);
//                         if (instance.url) {
//                           // Use the URL directly from the XNAT API response
//                           log.debug("XNAT: Using URL from instance:", instance.url);
//                           instanceURLPath = instance.url;
//                         } else if (instance.scanId && instance.name) {
//                           // Fallback to constructing URL if scanId and name are available
//                           instanceURLPath = `/data/experiments/${encodeURIComponent(experimentId)}/scans/${encodeURIComponent(instance.scanId)}/resources/DICOM/files/${encodeURIComponent(instance.name)}`;
//                           log.debug("XNAT: Constructed URL from parts:", instanceURLPath);
//                         } else {
//                           // Log error if we can't get a valid URL
//                           log.error("XNAT: Unable to determine instance URL", instance);
//                           return; // Skip this instance
//                         }
                        
//                         // Make sure we're getting a proper absolute URL based on the configuration
//                         const absoluteUrl = convertToAbsoluteUrl(instanceURLPath, baseUrl, xnatConfig);
                        
//                         // Create properly formatted imageId for Cornerstone using our helper function
//                         instance.url = absoluteUrl;
//                         instance.imageId = getAppropriateImageId(absoluteUrl, 'dicomweb');
                        
//                         // --- ADD URL TO METADATA ---
//                         instance.metadata = instance.metadata || {}; // Ensure metadata object exists
//                         instance.metadata.url = absoluteUrl; // Add the URL here
//                         // --- END ADDITION ---
                        
//                         // If metadata doesn't exist, create it
//                         if (!instance.metadata) {
//                           instance.metadata = {};
//                         }
                        
//                         // --- Revised Instance Metadata Construction ---
//                         // Start with the metadata fetched from XNAT
//                         const determinedModality = series.Modality || instance.metadata?.Modality || 'CT';

//                         // Log raw XNAT instance metadata before applying fallbacks
//                         log.info(`XNATDataSource: Raw instance.metadata for SOPInstanceUID ${instance.SOPInstanceUID || 'N/A'} from series ${series.SeriesInstanceUID}:`, JSON.parse(JSON.stringify(instance.metadata || {})));

//                         const instanceMetadata = {
//                           ...(instance.metadata || {}), // Ensure we start with an object

//                           // Add/Overwrite necessary calculated or series-level info
//                           url: absoluteUrl,
//                           imageId: instance.imageId,
//                           StudyInstanceUID: studyUid,
//                           SeriesInstanceUID: series.SeriesInstanceUID,
//                           Modality: determinedModality,
//                           modality: determinedModality, // ensure lowercase modality is also present

//                           // Add fallbacks for critical tags ONLY if they are missing from instance.metadata
//                           Rows: instance.metadata?.Rows || 512,
//                           Columns: instance.metadata?.Columns || 512,
//                           InstanceNumber: instance.metadata?.InstanceNumber || (index + 1).toString(),
//                           SOPInstanceUID: instance.metadata?.SOPInstanceUID || instance.SOPInstanceUID || generateRandomUID(),
//                           SOPClassUID: instance.metadata?.SOPClassUID || getSOPClassUIDForModality(series.Modality || instance.metadata?.Modality),
//                           ImagePositionPatient: instance.metadata?.ImagePositionPatient || [0, 0, index],
//                           ImageOrientationPatient: instance.metadata?.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
//                           PixelSpacing: instance.metadata?.PixelSpacing || [1, 1],
//                           SliceThickness: instance.metadata?.SliceThickness || 1,
//                           SliceLocation: instance.metadata?.SliceLocation || index,
//                           FrameOfReferenceUID: instance.metadata?.FrameOfReferenceUID || series.FrameOfReferenceUID || generateRandomUID(),

//                           // Ensure MPR flags are set
//                           isReconstructable: true,
//                           isMultiFrame: false,

//                           // Add custom XNAT properties
//                           xnatProjectId: projectId,
//                           xnatExperimentId: experimentId,
//                         };

//                         // Clean up potentially undefined keys (optional but good practice)
//                         Object.keys(instanceMetadata).forEach(key => {
//                           if (instanceMetadata[key] === undefined) {
//                             delete instanceMetadata[key];
//                           }
//                         });
//                         // --- End Revised Construction ---
                        
//                         log.info(`XNAT: retrieve.study.metadata - Processed instanceMetadata for SOPInstanceUID ${instanceMetadata.SOPInstanceUID}. Has Modality: ${instanceMetadata.Modality}, Has modality: ${instanceMetadata.modality}`);
                        
//                         // Add processed instance to the array for this series
//                         seriesProcessedInstances.push(instanceMetadata);
                        
//                         // Also add to the overall study instances
//                         processedStudy.instances.push(instanceMetadata);
                        
//                         // Make sure SOPClassUID is set based on modality - critical for proper display set creation
//                         if (series.Modality === 'MR') {
//                           // Use MR SOP Class for MR images
//                           instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.4';
//                         } else if (series.Modality === 'CT') {
//                           // Use CT SOP Class for CT images
//                           instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.2';
//                         } else if (series.Modality === 'PT') {
//                           // Positron Emission Tomography Image Storage
//                           instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.128';
//                         } else if (series.Modality === 'US') {
//                           // Ultrasound Image Storage
//                           instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.6.1';
//                         } else if (series.Modality === 'CR' || series.Modality === 'DX') {
//                           // Digital X-Ray Image Storage
//                           instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.1.1';
//                         } else {
//                           // Default to CT as fallback
//                           instanceMetadata.SOPClassUID = instanceMetadata.SOPClassUID || '1.2.840.10008.5.1.4.1.1.2';
//                         }
                        
//                         // Make sure SOPClassUID is in metadata too
//                         if (instanceMetadata.metadata) {
//                           instanceMetadata.metadata.SOPClassUID = instanceMetadata.metadata.SOPClassUID || instanceMetadata.SOPClassUID;
//                         }
//                       });
                      
//                       // Store processed instances for this series in the series object
//                       enhancedSeries.instances = seriesProcessedInstances;
                      
//                       // Add all instances for this series to the map for batched processing
//                       if (seriesProcessedInstances.length > 0) {
//                         const existingInstances = seriesInstancesMap.get(series.SeriesInstanceUID) || [];
//                         // IMPORTANT: Store the combined metadata temporarily
//                         seriesInstancesMap.set(series.SeriesInstanceUID, [...existingInstances, ...seriesProcessedInstances]); 
//                       }
//                     }
//                   });
//                 }
//               });
              
//               // Now add instances by series in batches, cleaning metadata first
//               const instancesToAdd = [];
//               log.info(`XNAT: retrieve.study.metadata - Initializing instancesToAdd. seriesInstancesMap size: ${seriesInstancesMap.size}, keys: ${Array.from(seriesInstancesMap.keys())}`); // Updated Log
//               for (const [seriesUID, instances] of seriesInstancesMap.entries()) { // seriesInstancesMap contains full instanceMetadata objects
//                 if (instances.length > 0) {
//                   log.info(`XNAT: retrieve.study.metadata - Processing seriesUID ${seriesUID} for cleaning. It has ${instances.length} raw instances before mapping.`); // Updated Log
//                   // Clean metadata for DicomMetadataStore
//                   const cleanedInstances = instances.map(processedInstance => { // instance here is an instanceMetadata object (previously named instance)
//                     log.info(`XNAT: retrieve.study.metadata - Instance before cleaning for SOPInstanceUID ${processedInstance.SOPInstanceUID}:`, JSON.parse(JSON.stringify(processedInstance))); // Deep copy for logging
                    
//                     // `processedInstance` IS the `instanceMetadata` object created earlier.
//                     // It contains naturalized DICOM fields from XNAT's original `instance.metadata` (spread in)
//                     // AND our explicitly added/overridden JS properties.

//                     // Create a copy to avoid modifying the original processedInstance when deleting keys
//                     const dicomDatasetToDenaturalize = { ...processedInstance };

//                     // Remove non-DICOM properties before denaturalizing to prevent dcmjs warnings/errors.
//                     // These will be added back to metadataForStore if needed.
//                     delete dicomDatasetToDenaturalize.url;
//                     delete dicomDatasetToDenaturalize.imageId;
//                     delete dicomDatasetToDenaturalize.isReconstructable;
//                     delete dicomDatasetToDenaturalize.isMultiFrame;
//                     delete dicomDatasetToDenaturalize.xnatProjectId;
//                     delete dicomDatasetToDenaturalize.xnatExperimentId;
//                     // `modality` (lowercase) is not a standard DICOM keyword, `Modality` (uppercase) is.
//                     delete dicomDatasetToDenaturalize.modality;


//                     const baseDicomTags = denaturalizeDataset(dicomDatasetToDenaturalize);

//                     const metadataForStore: InstanceMetadataForStore = {
//                         ...baseDicomTags // Start with all DICOM tags from processedInstance
//                     };

//                     // Ensure essential JS properties (that OHIF or Cornerstone might expect directly) are present.
//                     metadataForStore.StudyInstanceUID = processedInstance.StudyInstanceUID;
//                     metadataForStore.SeriesInstanceUID = processedInstance.SeriesInstanceUID;
//                     metadataForStore.SOPInstanceUID = processedInstance.SOPInstanceUID;
//                     metadataForStore.SOPClassUID = processedInstance.SOPClassUID;
//                     metadataForStore.Modality = processedInstance.Modality;     // For OHIF/Cornerstone direct access
//                     metadataForStore.modality = processedInstance.modality;   // For OHIF/Cornerstone direct access (lowercase)
//                     metadataForStore.InstanceNumber = processedInstance.InstanceNumber;
//                     metadataForStore.url = processedInstance.url; // Essential for OHIF image loading
//                     metadataForStore.imageId = processedInstance.imageId; // Essential for OHIF image loading

//                     metadataForStore.isReconstructable = processedInstance.isReconstructable !== undefined ? processedInstance.isReconstructable : true;
//                     metadataForStore.isMultiFrame = processedInstance.isMultiFrame !== undefined ? processedInstance.isMultiFrame : false;

//                     // Add ImageType and NumberOfFrames directly if available on processedInstance
//                     if (processedInstance.ImageType) {
//                         metadataForStore.ImageType = processedInstance.ImageType;
//                     }
//                     if (processedInstance.NumberOfFrames) {
//                         metadataForStore.NumberOfFrames = processedInstance.NumberOfFrames;
//                     }

//                     log.info(`XNAT: retrieve.study.metadata - metadataForStore before DICOM tag overrides for SOPInstanceUID ${metadataForStore.SOPInstanceUID}. Has Modality: ${metadataForStore.Modality}, Has modality: ${metadataForStore.modality}`);

//                     // Explicitly set/override critical DICOM tags using values from `processedInstance`
//                     if (processedInstance.StudyInstanceUID) metadataForStore['(0020,000D)'] = { vr: 'UI', Value: [processedInstance.StudyInstanceUID] };
//                     if (processedInstance.SeriesInstanceUID) metadataForStore['(0020,000E)'] = { vr: 'UI', Value: [processedInstance.SeriesInstanceUID] };
//                     if (processedInstance.SOPInstanceUID) metadataForStore['(0008,0018)'] = { vr: 'UI', Value: [processedInstance.SOPInstanceUID] };
//                     if (processedInstance.SOPClassUID) metadataForStore['(0008,0016)'] = { vr: 'UI', Value: [processedInstance.SOPClassUID] };
//                     if (processedInstance.Modality) metadataForStore['(0008,0060)'] = { vr: 'CS', Value: [processedInstance.Modality] };
//                     if (processedInstance.InstanceNumber) metadataForStore['(0020,0013)'] = { vr: 'IS', Value: [String(processedInstance.InstanceNumber)] };


//                     // Image Plane Module specific tags from `processedInstance` (which has fallbacks)
//                     metadataForStore['(0028,0010)'] = { vr: 'US', Value: [processedInstance.Rows] }; // Rows
//                     metadataForStore['(0028,0011)'] = { vr: 'US', Value: [processedInstance.Columns] }; // Columns
//                     metadataForStore['(0020,0037)'] = { vr: 'DS', Value: processedInstance.ImageOrientationPatient }; // ImageOrientationPatient
//                     metadataForStore['(0028,0030)'] = { vr: 'DS', Value: processedInstance.PixelSpacing }; // PixelSpacing
//                     metadataForStore['(0020,0052)'] = { vr: 'UI', Value: [processedInstance.FrameOfReferenceUID] }; // FrameOfReferenceUID
//                     metadataForStore['(0020,0032)'] = { vr: 'DS', Value: processedInstance.ImagePositionPatient }; // ImagePositionPatient
//                     // Ensure SliceThickness and SliceLocation are strings for DS VR
//                     metadataForStore['(0018,0050)'] = { vr: 'DS', Value: processedInstance.SliceThickness !== undefined ? [String(processedInstance.SliceThickness)] : [] };
//                     metadataForStore['(0020,1041)'] = { vr: 'DS', Value: processedInstance.SliceLocation !== undefined ? [String(processedInstance.SliceLocation)] : [] };


//                     log.info(`XNAT: retrieve.study.metadata - metadataForStore after cleaning for SOPInstanceUID ${processedInstance.SOPInstanceUID}:`, JSON.parse(JSON.stringify(metadataForStore)));
//                     return metadataForStore;
//                   });

//                   log.info(`XNAT: retrieve.study.metadata - SeriesUID ${seriesUID} produced ${cleanedInstances.length} cleanedInstances.`); // New Log
//                   instancesToAdd.push(...cleanedInstances);

//                   // Optional: Populate MetadataProvider separately with combined data if needed by other components
//                   // For now, we are removing this to rely on DicomMetadataStore and image loader
//                   /*
//                   try {
//                     const globalProvider = (window as any).cornerstone?.metaData;
//                     if (globalProvider && typeof globalProvider.add === 'function') {
//                       instances.forEach(instanceWithCombinedMeta => {
//                         if (instanceWithCombinedMeta.imageId) {
//                           globalProvider.add('instance', instanceWithCombinedMeta.imageId, instanceWithCombinedMeta);
//                         }
//                       });
//                     } else {
//                       log.warn('Cornerstone Metadata Provider not found or add function missing.');
//                     }
//                   } catch (error) {
//                     log.error('XNAT: Error adding combined instance metadata to cornerstone provider:', error);
//                   }
//                   */
//                 }
//               }

//               // Add cleaned instances to DicomMetadataStore
//               if (instancesToAdd.length > 0) {
//                 log.info(`XNAT: Adding ${instancesToAdd.length} cleaned instances to DicomMetadataStore.`);
//                 // Debug log to see what the cleaned instances contain
//                 if (instancesToAdd.length > 0) {
//                   const sampleInstance = instancesToAdd[0];
//                   log.info(`XNAT: Cleaned instance sample - StudyUID: ${sampleInstance.StudyInstanceUID}, SeriesUID: ${sampleInstance.SeriesInstanceUID}, SOPUID: ${sampleInstance.SOPInstanceUID}, Modality: ${sampleInstance.Modality}, modality: ${sampleInstance.modality}, SOPClassUID: ${sampleInstance.SOPClassUID}`);
//                   // Check a few expected tags
//                   log.info(`XNAT: Cleaned instance sample - ImageType: ${sampleInstance['(0008,0008)']}`); 
//                   log.info(`XNAT: Cleaned instance sample - url exists?: ${!!sampleInstance.url}`); // Should be true
//                   log.info(`XNAT: Cleaned instance sample - isReconstructable exists?: ${sampleInstance.isReconstructable !== undefined}`); // Should be true
//                 }
//                 DicomMetadataStore.addInstances(instancesToAdd, true);
//                 console.log('XNAT Study Metadata: Cleaned instances added to DicomMetadataStore');
//               } else {
//                 log.warn('XNAT: No instances found to add to DicomMetadataStore after cleaning. instancesToAdd is empty.'); // Updated Log
//               }
//             }
            
//             console.log(`XNAT: Processed study with ${processedStudy.series.length} series and ${processedStudy.instances.length} instances`);
//             if (processedStudy.instances.length > 0) {
//               console.log('XNAT: First instance URL (example):', processedStudy.instances[0]?.url);
//               console.log('XNAT: First instance imageId (example):', processedStudy.instances[0]?.imageId);
//               console.log('XNAT: First instance displaySetInstanceUID (example):', processedStudy.instances[0]?.displaySetInstanceUID);
//             }
            
//             // Handle batch mode if needed
//             const batchMode = options && options.batch === true;
//             if (batchMode) {
//               // In batch mode, we might need to add all instances to the DicomMetadataStore
//               const enableStudyLazyLoad = xnatConfig.enableStudyLazyLoad === undefined ? false : xnatConfig.enableStudyLazyLoad;
//               const madeInClient = options && options.madeInClient === true;
              
//               if (enableStudyLazyLoad === false && processedStudy.instances.length > 0) {
//                 try {
//                   // Add all instances to DicomMetadataStore at once
//                   await DicomMetadataStore.addInstances(processedStudy.instances, madeInClient);
//                 } catch (error) {
//                   console.error('XNAT: Error adding instances to DicomMetadataStore in batch mode:', error);
//                 }
//               }
//             }
            
//             // Initialize the metadata provider to help with cornerstone loading
//             // Moved this logic inside the loop processing seriesInstancesMap
//             /*
//             try {
//               const globalProvider = (window as any).cornerstone?.metaData;
//               if (globalProvider && typeof globalProvider.add === 'function') {
//                 processedStudy.instances.forEach(instance => {
//                   if (instance.SOPInstanceUID && instance.imageId) {
//                     // Add each metadata element to cornerstone provider
//                     Object.entries(instance).forEach(([key, value]) => {
//                       if (key !== 'imageId' && value !== undefined) {
//                         globalProvider.add(key, instance.imageId, value);
//                       }
//                     });
//                   }
//                 });
//                 log.info('XNAT: Added study instances metadata to cornerstone provider');
//               }
//             } catch (error) {
//               log.error('XNAT: Error adding study instances to cornerstone provider:', error);
//             }
//             */
            
//             // Add this code at the appropriate place after the metadata is loaded but before display sets are created
//             try {
//               const { AppContext } = servicesManager.services;
//               if (AppContext && xnatMetadata && xnatMetadata.studies) {
//                 // Initialize the xnatSeriesMetadata structure if it doesn't exist
//                 if (!AppContext.xnatSeriesMetadata) {
//                   AppContext.xnatSeriesMetadata = {};
//                 }

//                 // Store series metadata by StudyInstanceUID for easy lookup
//                 xnatMetadata.studies.forEach(study => {
//                   const studyInstanceUID = study.StudyInstanceUID;
                  
//                   // Initialize the study entry if it doesn't exist
//                   if (!AppContext.xnatSeriesMetadata[studyInstanceUID]) {
//                     AppContext.xnatSeriesMetadata[studyInstanceUID] = {
//                       PatientID: study.PatientID,
//                       PatientName: study.PatientName,
//                       StudyDate: study.StudyDate,
//                       StudyTime: study.StudyTime, 
//                       StudyDescription: study.StudyDescription,
//                       series: []
//                     };
//                   }

//                   // Add all series from this study
//                   if (study.series && study.series.length > 0) {
//                     study.series.forEach(series => {
//                       // Store series with complete metadata
//                       const seriesMetadata = {
//                         SeriesInstanceUID: series.SeriesInstanceUID,
//                         SeriesDescription: series.SeriesDescription || '',
//                         SeriesNumber: series.SeriesNumber || '',
//                         SeriesDate: series.SeriesDate || study.StudyDate || '',
//                         SeriesTime: series.SeriesTime || study.StudyTime || '',
//                         Modality: series.Modality || '',
//                         // Include study level info for reference
//                         StudyInstanceUID: study.StudyInstanceUID,
//                         PatientID: study.PatientID,
//                         PatientName: study.PatientName,
//                         StudyDate: study.StudyDate,
//                         StudyTime: study.StudyTime,
//                         StudyDescription: study.StudyDescription
//                       };

//                       // Add to the series array
//                       AppContext.xnatSeriesMetadata[studyInstanceUID].series.push(seriesMetadata);
//                     });
//                   }
//                 });

//               }
//             } catch (error) {
//               console.error('XNAT: Error storing metadata in AppContext:', error);
//             }
            
//             return processedStudy;
//           } catch (error) {
//             console.error('XNAT: Error retrieving or processing study metadata:', error);
//             return null;
//           }
//         },
        
//         dicomWeb: async (studyInstanceUID, filters) => {
//           console.log('XNAT retrieve study dicomWeb');
//           if (!wadoDicomWebClient) {
//             console.error('wadoDicomWebClient not available - study dicomWeb retrieval may fail');
//             return;
//           }
//           wadoDicomWebClient.headers = getAuthorizationHeader();
          
//           return wadoDicomWebClient.retrieveStudy({
//             studyInstanceUID,
//             queryParams: filters,
//           });
//         },
//       },
      
//       instance: {
//         metadata: async function (
//           studyInstanceUID,
//           seriesInstanceUID,
//           sopInstanceUID
//         ) {
//           console.log('XNAT retrieve instance metadata');
//           if (!wadoDicomWebClient) {
//             console.error('wadoDicomWebClient not available - instance metadata retrieval may fail');
//             return;
//           }
//           wadoDicomWebClient.headers = getAuthorizationHeader();
          
          
//           const instance = await wadoDicomWebClient.retrieveInstanceMetadata({
//             studyInstanceUID,
//             seriesInstanceUID,
//             sopInstanceUID,
//           });
          
//           return naturalizeDataset(instance);
//         },
        
//         rendered: async function (
//           studyInstanceUID,
//           seriesInstanceUID,
//           sopInstanceUID,
//           frameNumbers
//         ) {
//           console.log('XNAT retrieve instance rendered');
//           if (!wadoDicomWebClient) {
//             console.error('wadoDicomWebClient not available - instance rendered retrieval may fail');
//             return;
//           }
//           wadoDicomWebClient.headers = getAuthorizationHeader();
          
//           const config = {
//             studyInstanceUID,
//             seriesInstanceUID,
//             sopInstanceUID,
//             frameNumbers,
//             acceptHeader: 'image/jpeg',
//           };
          
//           return wadoDicomWebClient.retrieveInstanceRendered(config);
//         },
        
//         framesSingleFrame: async function (
//           studyInstanceUID,
//           seriesInstanceUID,
//           sopInstanceUID,
//           frameNumbers
//         ) {
//           console.log('XNAT retrieve instance framesSingleFrame');
//           if (!wadoDicomWebClient) {
//             console.error('wadoDicomWebClient not available - instance framesSingleFrame retrieval may fail');
//             return;
//           }
//           wadoDicomWebClient.headers = getAuthorizationHeader();
          
//           return wadoDicomWebClient.retrieveInstanceFrames({
//             studyInstanceUID,
//             seriesInstanceUID,
//             sopInstanceUID,
//             frameNumbers,
//           });
//         },
        
//         bulkdata: async function (
//           studyInstanceUID,
//           seriesInstanceUID,
//           sopInstanceUID,
//           bulkdataInfo
//         ) {
//           console.log('XNAT retrieve instance bulkdata');
//           if (!wadoDicomWebClient) {
//             console.error('wadoDicomWebClient not available - instance bulkdata retrieval may fail');
//             return;
//           }
//           wadoDicomWebClient.headers = getAuthorizationHeader();
          
//           return wadoDicomWebClient.retrieveBulkData({
//             studyInstanceUID,
//             seriesInstanceUID,
//             sopInstanceUID,
//             bulkdataInfo,
//           });
//         },
        
//         originalBulkData: async function (
//           studyInstanceUID,
//           seriesInstanceUID,
//           sopInstanceUID,
//           bulkDataURI
//         ) {
//           console.log('XNAT retrieve instance originalBulkData');
//           if (!wadoDicomWebClient) {
//             console.error('wadoDicomWebClient not available - instance originalBulkData retrieval may fail');
//             return;
//           }
//           wadoDicomWebClient.headers = getAuthorizationHeader();
          
//           return wadoDicomWebClient.retrieveBulkData({
//             studyInstanceUID,
//             seriesInstanceUID,
//             sopInstanceUID,
//             bulkDataURI,
//           });
//         },
//       },
//     },
    
//     store: {
//       dicom: async function (datasets) {
//         console.log('XNAT store dicom');
//         if (!wadoDicomWebClient) {
//           console.error('wadoDicomWebClient not available - store dicom may fail');
//           throw new Error('XNAT storeInstances failed: wadoDicomWebClient not available');
//         }
        
//         try {
//           // Set the headers for authentication
//           wadoDicomWebClient.headers = getAuthorizationHeader();
//           console.log('XNAT store dicom: using headers', wadoDicomWebClient.headers);
          
//           const naturalizedDatasets = Array.isArray(datasets)
//             ? datasets.map(naturalizeDataset)
//             : [naturalizeDataset(datasets)];
          
//           const denaturalizedDatasets = naturalizedDatasets.map(denaturalizeDataset);
          
//           // Attempt to store the instances
//           const result = await wadoDicomWebClient.storeInstances({
//             datasets: denaturalizedDatasets,
//           });
          
//           console.log('XNAT store dicom: success', result);
//           return result;
//         } catch (error) {
//           console.error('XNAT store dicom: failed', error);
//           throw new Error(`XNAT storeInstances failed: ${error.message || 'unknown error'}`);
//         }
//       },
//     },
    
//     deleteStudyMetadataPromise,
//     getImageId,
    
//     // Add the XNAT-specific methods before the getImageIdsForDisplaySet method:
    
//     xnat: {
//       getExperimentMetadata: async (projectId, experimentId) => {
//         log.info(`XNATDataSource: xnat.getExperimentMetadata called for ${projectId}/${experimentId}`);
//         const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;
//         const baseUrl = dicomWebConfigCopy.wadoRoot || 'http://localhost';
//         const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, dicomWebConfigCopy);
//         const headers = getAuthorizationHeader(); 
//         log.info(`XNATDataSource: Fetching from apiUrl: ${apiUrl}`);
//         try {
//           const response = await fetch(apiUrl, {
//             method: 'GET',
//             headers: { 'Accept': 'application/json', ...headers },
//           });

//           log.info(`XNATDataSource: Received response from ${apiUrl} - Status: ${response.status}, StatusText: ${response.statusText}, OK: ${response.ok}`);

//           if (!response.ok) {
//             const errorText = await response.text(); // Attempt to get error body
//             log.error(`XNAT API error fetching experiment ${experimentId}: ${response.status} ${response.statusText}. Body: ${errorText}`);
//             throw new Error(`XNAT API error: ${response.status} ${response.statusText}. Body: ${errorText}`);
//           }

//           // Try to parse JSON, and catch if it fails
//           let data;
//           try {
//             data = await response.json();
//             log.info(`XNATDataSource: xnat.getExperimentMetadata successfully parsed JSON for ${experimentId}:`, data);
//           } catch (jsonError) {
//             log.error(`XNATDataSource: Failed to parse JSON response for ${experimentId}. URL: ${apiUrl}, Status: ${response.status}. Error:`, jsonError);
//             const responseText = await response.text(); // Log the raw text response if JSON parsing fails
//             log.error(`XNATDataSource: Raw response text for ${experimentId}: ${responseText}`);
//             throw jsonError; // Re-throw the JSON parsing error
//           }
//           return data; 
//         } catch (fetchError) {
//           // This catches network errors or errors thrown from the !response.ok block or jsonError processing
//           log.error(`XNATDataSource: Error during fetch or processing for ${experimentId}. URL: ${apiUrl}. Error:`, fetchError);
//           throw fetchError; // Re-throw to be caught by the caller (retrieveSeriesMetadataAsync)
//         }
//       },
      
//       getSubjectMetadata: async (projectId, subjectId) => {
//         if (!projectId || !subjectId) {
//           console.error('XNAT: Missing projectId or subjectId for metadata fetch');
//           return null;
//         }
        
//         try {
//           // Use the wadoRoot from configuration as the base URL
//           const baseUrl = dicomWebConfigCopy.wadoRoot || 'http://localhost';
          
//           // Construct a standardized API URL path
//           const apiPath = `/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
//           const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, dicomWebConfigCopy);
          
//           const headers = getAuthorizationHeader();
          
//           const response = await fetch(apiUrl, {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               ...headers
//             }
//           });
          
//           if (!response.ok) {
//             console.error('XNAT: Failed to fetch subject metadata', response.status, response.statusText);
//             throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
//           }
          
//           const data = await response.json();
//           return data;
//         } catch (error) {
//           console.error('XNAT: Error fetching subject metadata:', error);
//           throw error;
//         }
//       },
      
//       getProjectMetadata: async (projectId) => {
//         if (!projectId) {
//           console.error('XNAT: Missing projectId for metadata fetch');
//           return null;
//         }
        
//         try {
//           // Use the wadoRoot from configuration as the base URL
//           const baseUrl = dicomWebConfigCopy.wadoRoot || 'http://localhost';
//           // Construct a standardized API URL path
//           const apiPath = `/xapi/viewer/projects/${projectId}`;
//           const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, dicomWebConfigCopy);
          
//           console.log('XNAT: Constructed API URL:', apiUrl);
          
//           const headers = getAuthorizationHeader();
          
//           const response = await fetch(apiUrl, {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               ...headers
//             }
//           });
          
//           if (!response.ok) {
//             console.error('XNAT: Failed to fetch project metadata', response.status, response.statusText);
//             throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
//           }
          
//           const data = await response.json();
//           return data;
//         } catch (error) {
//           console.error('XNAT: Error fetching project metadata:', error);
//           throw error;
//         }
//       }
//     },
    
//     getImageIdsForDisplaySet(displaySet) {
//       const images = displaySet.images;
//       const imageIds = [];

//       if (!images) {
//         return imageIds;
//       }

//       displaySet.images.forEach(instance => {
//         const NumberOfFrames = instance.NumberOfFrames;

//         if (NumberOfFrames > 1) {
//           for (let frame = 1; frame <= NumberOfFrames; frame++) {
//             const imageId = this.getImageIdsForInstance({
//               instance,
//               frame,
//             });
//             imageIds.push(imageId);
//           }
//         } else {
//           const imageId = this.getImageIdsForInstance({ instance });
//           imageIds.push(imageId);
//         }
//       });

//       return imageIds;
//     },
    
//     getImageIdsForInstance({ instance, frame = undefined }) {
//       const imageIds = getImageId({
//         instance,
//         frame,
//         config: dicomWebConfigCopy,
//       });
//       return imageIds;
//     },
    
//     getConfig,
    
//     getStudyInstanceUIDs({ params, query }) {
//       const paramsStudyInstanceUIDs = params.StudyInstanceUIDs || params.studyInstanceUIDs;

//       const queryStudyInstanceUIDs = utils.splitComma(
//         query.getAll('StudyInstanceUIDs').concat(query.getAll('studyInstanceUIDs'))
//       );

//       const StudyInstanceUIDs =
//         (queryStudyInstanceUIDs.length && queryStudyInstanceUIDs) || paramsStudyInstanceUIDs;
//       const StudyInstanceUIDsAsArray =
//         StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
//           ? StudyInstanceUIDs
//           : [StudyInstanceUIDs];

//       return StudyInstanceUIDsAsArray;
//     },
//   };

//   console.log('implementation', implementation);
//   if (xnatConfig.supportsReject && typeof dcm4cheeReject === 'function') {
//     console.log('reject');
//     implementation['reject'] = dcm4cheeReject(xnatConfig.wadoRoot, getAuthorizationHeader);
//   }

//   return IWebApiDataSource.create(implementation as any);
// }

// // Export for use in the XNATDataSource and initialize it
// export { createXNATApi };

