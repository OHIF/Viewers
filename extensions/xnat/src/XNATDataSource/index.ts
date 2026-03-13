// External dependencies
import { DicomMetadataStore, IWebApiDataSource, utils, classes } from '@ohif/core';
import dcmjs from 'dcmjs';
import getImageId from '../DicomWebDataSource/utils/getImageId.js';
import { retrieveStudyMetadata, deleteStudyMetadataPromise } from '../DicomWebDataSource/retrieveStudyMetadata.js';
import getDirectURL from '../utils/getDirectURL';
import { fixBulkDataURI } from '../DicomWebDataSource/utils/fixBulkDataURI';
import dcm4cheeReject from '../DicomWebDataSource/dcm4cheeReject.js';

// Utility imports
import {
  getXNATStatusFromStudyInstanceUID,
} from './Utils/DataSourceUtils';
import { getSOPClassUIDForModality } from './Utils/SOPUtils';
import { ensureInstanceRequiredFields } from './Utils/instanceUtils';
import { generateRandomUID } from './Utils/UIDUtils';

// Extracted modules
import type { XNATDataSourceConfig, BulkDataURIConfig, InstanceMetadataForStore } from './types';
import { log, getAppropriateImageId } from './constants';
import { setXNATImageIdUids } from '../xnatImageIdUidsMap';
import { XNATDataSourceConfigManager } from './config';
import { XNATQueryMethods } from './query';
import { XNATStoreMethods } from './store';
import { XNATApi } from './xnat-api';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;


const metadataProvider = classes.MetadataProvider;


/**
 * Creates a DICOM Web API based on the provided configuration.
 *
 * @param xnatConfig - Configuration for the DICOM Web API
 * @returns DICOM Web API object
 */
function createDataSource(xnatConfig: XNATDataSourceConfig, servicesManager) {
  const { userAuthenticationService } = servicesManager.services;
  const configManager = new XNATDataSourceConfigManager(xnatConfig, userAuthenticationService);

  // Initialize XNAT API methods
  const xnatApi = new XNATApi(configManager);

  const implementation = {
    initialize: ({ params, query }) => {
      configManager.initialize({ params, query });
    },
    get query() {
      return queryMethods;
    },
    retrieve: {
      getGetThumbnailSrc: function (instance, imageId) {
        if (configManager.getConfig().thumbnailRendering === 'wadors') {
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
        if (configManager.getConfig().thumbnailRendering === 'thumbnailDirect') {
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

        if (configManager.getConfig().thumbnailRendering === 'thumbnail') {
          return async function getThumbnailSrc() {
            const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
            const bulkDataURI = `${configManager.getConfig().wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/thumbnail?accept=image/jpeg`;
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
        if (configManager.getConfig().thumbnailRendering === 'rendered') {
          return async function getThumbnailSrc() {
            const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
            const bulkDataURI = `${configManager.getConfig().wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/rendered?accept=image/jpeg`;
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
            wadoRoot: configManager.getConfig().wadoRoot,
            singlepart: configManager.getConfig().singlepart,
          },
          params
        );
      },
      getWadoDicomWebClient: () => configManager.getWadoClient(),
      bulkDataURI: async ({ StudyInstanceUID, BulkDataURI, instance }) => { // Added instance
        configManager.getQidoClient().headers = configManager.getAuthorizationHeader();
        // Only call fixBulkDataURI if we have a valid config with bulkDataURI settings
        let finalBulkDataURI = BulkDataURI;
        if (configManager.getConfig() && configManager.getConfig().bulkDataURI && instance) {
          const tempValue = { BulkDataURI };
          fixBulkDataURI(tempValue, instance, configManager.getConfig());
          finalBulkDataURI = tempValue.BulkDataURI;
        }

        const options = {
          multipart: false,
          BulkDataURI: finalBulkDataURI,
          StudyInstanceUID,
        };
        return configManager.getQidoClient().retrieveBulkData(options).then(val => {
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

          const retrieveSeriesMetadataAsync = async () => {

            // Check if this is a comparison view (declare early for scope)
            const isComparisonView = ['@ohif/mrSubjectComparison', '@ohif/hpCompare'].includes((configManager.getConfig() as any)?.xnat?.hangingProtocolId);
            const isSyntheticExperimentUID = StudyInstanceUID.startsWith('xnat_experiment_');

            let seriesAndInstances;
            try {
              if (!configManager.getConfig()) {
                log.error('XNAT: configManager.getConfig() is not available in retrieveSeriesMetadataAsync.');
                // Config should be initialized by this point, this indicates a flow issue
                throw new Error('Configuration not properly initialized');
              }

              const studyMappings =
                (configManager.getConfig().xnat && configManager.getConfig().xnat?.studyMappings) || {};
              const mappedEntry = studyMappings[StudyInstanceUID] || {};

              let resolvedProjectId = mappedEntry.projectId;
              let resolvedExperimentId = mappedEntry.experimentId;

              // Handle synthetic UIDs for experiment-based comparison
              if (isSyntheticExperimentUID && !resolvedExperimentId) {
                // Extract experimentId from synthetic UID: xnat_experiment_{index}_{experimentId}
                const parts = StudyInstanceUID.split('_');
                if (parts.length >= 4) {
                  resolvedExperimentId = parts.slice(3).join('_'); // Join back in case experimentId contains underscores
                }
              }

              if (!resolvedProjectId || !resolvedExperimentId) {
                const parsed = getXNATStatusFromStudyInstanceUID(
                  StudyInstanceUID,
                  configManager.getConfig()
                );
                resolvedProjectId = resolvedProjectId || parsed.projectId;
                resolvedExperimentId = resolvedExperimentId || parsed.experimentId;

                if (parsed.projectId && parsed.experimentId) {
                  log.warn(
                    `XNAT: Using parsed projectId ${parsed.projectId} and experimentId ${parsed.experimentId} from StudyInstanceUID ${StudyInstanceUID}`
                  );
                } else if (isComparisonView) {
                  // For comparison views, try to use the parsed values even if incomplete
                  log.warn(
                    `XNAT: Comparison view - attempting to resolve study ${StudyInstanceUID} with incomplete project/experiment info`
                  );
                }
              }

              if (!resolvedProjectId) {
                resolvedProjectId = configManager.getConfig().xnat?.projectId;
              }

              if (!resolvedExperimentId) {
                resolvedExperimentId =
                  configManager.getConfig().xnat?.experimentId || configManager.getConfig().xnat?.sessionId;
              }

              if (!resolvedProjectId || !resolvedExperimentId) {
                log.error(
                  `XNAT: Missing projectId or experimentId in config for StudyInstanceUID ${StudyInstanceUID}. projectId: ${resolvedProjectId}, experimentId: ${resolvedExperimentId}`
                );
                log.error(`XNAT: Unable to parse projectId/experimentId from StudyInstanceUID ${StudyInstanceUID}`);
                throw new Error(`Cannot determine XNAT projectId/experimentId for ${StudyInstanceUID}`);
              }

              if (!mappedEntry.projectId || !mappedEntry.experimentId) {
                log.warn(
                  `XNAT: Using configured projectId ${resolvedProjectId} and experimentId ${resolvedExperimentId} for StudyInstanceUID ${StudyInstanceUID}`
                );
              }

              seriesAndInstances = await implementation.xnat.getExperimentMetadata(
                resolvedProjectId,
                resolvedExperimentId
              );
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

            // For synthetic UIDs, find the study in the experiment data (which has the real DICOM StudyInstanceUID)
            // and modify it to use our synthetic StudyInstanceUID
            let study;
            if (isSyntheticExperimentUID) {
              // For synthetic UIDs, use the first (and typically only) study from the experiment
              study = seriesAndInstances.studies[0];
              if (study) {
                // Extract the index from the synthetic UID: xnat_experiment_{index}_{experimentId}
                const parts = StudyInstanceUID.split('_');
                const studyIndex = parseInt(parts[2], 10) || 0;

                // Create a copy of the study with the synthetic StudyInstanceUID
                study = {
                  ...study,
                  StudyInstanceUID: StudyInstanceUID, // Replace with synthetic UID
                  studyInstanceUIDsIndex: studyIndex, // Add the index for hanging protocol matching
                };
                console.log(`XNATDataSource: Modified study for synthetic UID ${StudyInstanceUID}, original was ${seriesAndInstances.studies[0].StudyInstanceUID}, index: ${studyIndex}`);
              }
            } else {
              // For regular DICOM UIDs, find the matching study
              study = seriesAndInstances.studies.find(s => s.StudyInstanceUID === StudyInstanceUID);
            }

            if (!study || !study.series || study.series.length === 0) {
              const logLevel = isComparisonView ? 'debug' : 'warn';
              log[logLevel](`XNAT: No series found for StudyInstanceUID ${StudyInstanceUID} within the experiment data.${isComparisonView ? ' (Comparison view - this is expected for cross-experiment studies)' : ''}`);
              return [];
            }


            const allNaturalizedInstancesForStudy = [];

            for (const series of study.series) {
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
                const imageId = getAppropriateImageId(configManager.getConfig().wadoRoot + xnatInstance.url, configManager.getConfig().imageRendering);


                // FrameOfReferenceUID is required for MPR/reference viewable and getClosestImageId; use DICOM value or one per series
                const frameOfReferenceUID =
                  (xnatMeta as any).FrameOfReferenceUID ??
                  (series as any).FrameOfReferenceUID ??
                  series.SeriesInstanceUID;

                let naturalized = {
                  StudyInstanceUID,
                  SeriesInstanceUID: series.SeriesInstanceUID,
                  SOPInstanceUID: sopInstanceUID,
                  Modality: determinedModality,
                  modality: determinedModality,
                  imageId: imageId,
                  wadoRoot: configManager.getConfig().wadoRoot, // For OHIF DicomMetadataStore
                  wadoUri: configManager.getConfig().wadoUri,   // For OHIF DicomMetadataStore
                  ...(xnatMeta as any),
                  FrameOfReferenceUID: frameOfReferenceUID,
                  SOPClassUID: xnatMeta.SOPClassUID || getSOPClassUIDForModality(determinedModality),
                  InstanceNumber: xnatMeta.InstanceNumber || (index + 1).toString(),
                  NumberOfFrames: xnatMeta.NumberOfFrames || 1, // Ensure NumberOfFrames
                  // Add other fallbacks as needed for viewer display
                  Rows: xnatMeta.Rows || 512,
                  Columns: xnatMeta.Columns || 512,
                  PixelSpacing: xnatMeta.PixelSpacing || [1, 1],
                  SliceThickness: xnatMeta.SliceThickness || 1,
                  ImagePositionPatient: xnatMeta.ImagePositionPatient || [0, 0, index],
                  ImageOrientationPatient: xnatMeta.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
                  ImageType: xnatMeta.ImageType || 'ORIGINAL',
                  PhotometricInterpretation: xnatMeta.PhotometricInterpretation || (determinedModality === 'CT' || determinedModality === 'MR' || determinedModality === 'PT' ? 'MONOCHROME2' : 'RGB'),
                  SamplesPerPixel: xnatMeta.SamplesPerPixel || ((determinedModality === 'CT' || determinedModality === 'MR' || determinedModality === 'PT') ? 1 : 3),
                  PixelRepresentation: xnatMeta.PixelRepresentation === undefined ? ((determinedModality === 'MR' || determinedModality === 'CT') ? 1 : 0) : xnatMeta.PixelRepresentation,
                  BitsAllocated: xnatMeta.BitsAllocated || 16,
                  BitsStored: xnatMeta.BitsStored || (xnatMeta.BitsAllocated || 16),
                  HighBit: xnatMeta.HighBit === undefined ? ((xnatMeta.BitsStored || (xnatMeta.BitsAllocated || 16)) - 1) : xnatMeta.HighBit,
                };

                // Multi-frame (Enhanced MR): synthetic per-frame geometry so MPR can reconstruct the volume and sagittal/coronal proportions are correct
                const numFrames = naturalized.NumberOfFrames || 1;
                if (numFrames > 1 && !naturalized.PerFrameFunctionalGroupsSequence) {
                  const origin = (naturalized.ImagePositionPatient || [0, 0, 0]).map(Number);
                  const orientation = (naturalized.ImageOrientationPatient || [1, 0, 0, 0, 1, 0]).map(Number);
                  const pixelSpacing = naturalized.PixelSpacing || [1, 1];
                  const inPlaneSpacing = Math.max(Number(pixelSpacing[0]) || 1, Number(pixelSpacing[1]) || 1);
                  const sliceThicknessNum = naturalized.SliceThickness != null ? Number(naturalized.SliceThickness) : 0;
                  const spacing = naturalized.SpacingBetweenSlices != null
                    ? Number(naturalized.SpacingBetweenSlices)
                    : sliceThicknessNum >= inPlaneSpacing
                      ? sliceThicknessNum
                      : inPlaneSpacing * 2.5;

                  const rowDir = orientation.slice(0, 3);
                  const colDir = orientation.slice(3, 6);
                  const normal = [
                    rowDir[1] * colDir[2] - rowDir[2] * colDir[1],
                    rowDir[2] * colDir[0] - rowDir[0] * colDir[2],
                    rowDir[0] * colDir[1] - rowDir[1] * colDir[0],
                  ];
                  const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
                  const perFrame = [];
                  for (let f = 0; f < numFrames; f++) {
                    perFrame.push({
                      PlanePositionSequence: [{
                        ImagePositionPatient: [
                          round6(origin[0] + normal[0] * spacing * f),
                          round6(origin[1] + normal[1] * spacing * f),
                          round6(origin[2] + normal[2] * spacing * f),
                        ],
                      }],
                    });
                  }
                  naturalized.PerFrameFunctionalGroupsSequence = perFrame;
                  naturalized.SharedFunctionalGroupsSequence = [{
                    PixelMeasuresSequence: [{ PixelSpacing: pixelSpacing, SliceThickness: spacing, SpacingBetweenSlices: spacing }],
                    PlaneOrientationSequence: [{ ImageOrientationPatient: orientation }],
                  }];
                  delete naturalized.ImagePositionPatient;
                }

                // Ensure required fields for DicomMetadataStore
                naturalized = ensureInstanceRequiredFields(naturalized, configManager.getConfig());

                naturalizedInstancesForThisSeries.push(naturalized);
                allNaturalizedInstancesForStudy.push(naturalized);

                const dicomDatasetToDenaturalize = { ...naturalized };
                delete dicomDatasetToDenaturalize.imageId;
                delete dicomDatasetToDenaturalize.modality;
                delete dicomDatasetToDenaturalize.wadoRoot;
                delete dicomDatasetToDenaturalize.wadoUri;
                delete dicomDatasetToDenaturalize.PerFrameFunctionalGroupsSequence;
                delete dicomDatasetToDenaturalize.SharedFunctionalGroupsSequence;

                const firstFramePosition = naturalized.PerFrameFunctionalGroupsSequence?.[0]?.PlanePositionSequence?.[0]?.ImagePositionPatient;
                const sharedPixelMeasures = naturalized.SharedFunctionalGroupsSequence?.[0]?.PixelMeasuresSequence?.[0];
                const spacingBetweenSlices = sharedPixelMeasures?.SpacingBetweenSlices ?? sharedPixelMeasures?.SliceThickness ?? naturalized.SliceThickness;
                const storable = {
                  ...denaturalizeDataset(dicomDatasetToDenaturalize),
                  StudyInstanceUID,
                  SeriesInstanceUID: series.SeriesInstanceUID,
                  SOPInstanceUID: naturalized.SOPInstanceUID,
                  Modality: determinedModality,
                  modality: determinedModality,
                  SOPClassUID: naturalized.SOPClassUID,
                  InstanceNumber: naturalized.InstanceNumber,
                  FrameOfReferenceUID: naturalized.FrameOfReferenceUID,
                  ...(spacingBetweenSlices != null && { SpacingBetweenSlices: spacingBetweenSlices }),
                  url: imageId.startsWith('dicomweb:') ? imageId.substring(9) : imageId,
                  imageId: imageId,
                  PerFrameFunctionalGroupsSequence: naturalized.PerFrameFunctionalGroupsSequence,
                  SharedFunctionalGroupsSequence: naturalized.SharedFunctionalGroupsSequence,
                  Rows: naturalized.Rows,
                  Columns: naturalized.Columns,
                  PixelSpacing: naturalized.PixelSpacing,
                  SliceThickness: naturalized.SliceThickness,
                  ImagePositionPatient: naturalized.ImagePositionPatient ?? firstFramePosition,
                  ImageOrientationPatient: naturalized.ImageOrientationPatient,
                  ImageType: naturalized.ImageType,
                  NumberOfFrames: naturalized.NumberOfFrames,
                  PhotometricInterpretation: naturalized.PhotometricInterpretation,
                  SamplesPerPixel: naturalized.SamplesPerPixel,
                  PixelRepresentation: naturalized.PixelRepresentation,
                  BitsAllocated: naturalized.BitsAllocated,
                  BitsStored: naturalized.BitsStored,
                  HighBit: naturalized.HighBit,
                  wadoRoot: configManager.getConfig().wadoRoot,
                  wadoUri: configManager.getConfig().wadoUri,
                  SeriesDescription: series.SeriesDescription || '',
                };
                instancesToStoreForThisSeries.push(storable);

                // Add to metadataProvider for each frame
                const numberOfFrames = naturalized.NumberOfFrames || 1;
                const uids = {
                  StudyInstanceUID,
                  SeriesInstanceUID: series.SeriesInstanceUID,
                  SOPInstanceUID: naturalized.SOPInstanceUID,
                };
                const generalSeriesModule = {
                  modality: naturalized.Modality || series.Modality || 'OT',
                  seriesInstanceUID: series.SeriesInstanceUID,
                  studyInstanceUID: StudyInstanceUID,
                };
                for (let i = 0; i < numberOfFrames; i++) {
                  const frameNumber = i + 1;
                  const frameImageId = implementation.getImageIdsForInstance({
                    instance: naturalized, // Use the naturalized object with imageId
                    frame: numberOfFrames > 1 ? frameNumber : undefined,
                  });
                  const frameUids = {
                    ...uids,
                    frameNumber: numberOfFrames > 1 ? frameNumber : undefined,
                  };
                  metadataProvider.addImageIdToUIDs(frameImageId, frameUids);
                  // OHIF MetadataProvider getUIDsFromImageID strips &frame= and looks up base URL
                  if (frameImageId.includes('&frame=')) {
                    const baseImageId =
                      (frameImageId.split('&frame=')[0] || '').replace(/[?&]$/, '') || frameImageId;
                    if (baseImageId && baseImageId !== frameImageId) {
                      const hasScheme = baseImageId.startsWith('dicomweb:') || baseImageId.startsWith('http');
                      metadataProvider.addImageIdToUIDs(
                        hasScheme ? baseImageId : `dicomweb:${baseImageId}`,
                        frameUids
                      );
                      // So Cornerstone metadata provider can resolve imagePlaneModule for frame-level imageIds (MPR)
                      const baseUri = utils.imageIdToURI(hasScheme ? baseImageId : `dicomweb:${baseImageId}`);
                      setXNATImageIdUids(baseUri, { StudyInstanceUID: uids.StudyInstanceUID, SeriesInstanceUID: uids.SeriesInstanceUID, SOPInstanceUID: uids.SOPInstanceUID });
                    }
                  }
                  metadataProvider.addCustomMetadata(
                    frameImageId,
                    'generalSeriesModule',
                    generalSeriesModule
                  );
                }
                // Register bare instance imageId (no ?_=0 or &frame=) for frame 1 so
                // getClosestImageId / base imageId lookups work in volume viewports.
                const bareBaseId = imageId.startsWith('dicomweb:') ? imageId : `dicomweb:${imageId}`;
                metadataProvider.addImageIdToUIDs(bareBaseId, { ...uids, frameNumber: 1 });
              });

              if (instancesToStoreForThisSeries.length > 0) {
                DicomMetadataStore.addInstances(instancesToStoreForThisSeries, madeInClient);
              }
            }

            // Add Series level metadata (summary) to DicomMetadataStore
            const seriesSummaryMetadata = study.series.map(s => {
              return {
                StudyInstanceUID, // This will be the synthetic UID for synthetic cases
                SeriesInstanceUID: s.SeriesInstanceUID,
                Modality: s.Modality || "Unknown",
                SeriesDescription: s.SeriesDescription || "XNAT Series",
                SeriesNumber: s.SeriesNumber || "1",
                // Add other relevant series tags from XNAT if available
              };
            });
            DicomMetadataStore.addSeriesMetadata(seriesSummaryMetadata, madeInClient);


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
              start: function () {
                if (!this._promise) {
                  this._promise = retrieveSeriesMetadataAsync();
                }
                return this._promise;
              },
              then: function (onFulfilled, onRejected) {
                if (!this._promise) { this.start(); }
                return this._promise.then(onFulfilled, onRejected).finally(setSuccessFlag);
              },
              catch: function (onRejected) {
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

          let projectId = configManager.getConfig().xnat?.projectId;
          let experimentId = configManager.getConfig().xnat?.experimentId || configManager.getConfig().xnat?.sessionId;

          if ((!projectId || !experimentId) && studyUid) {
            const parsed = getXNATStatusFromStudyInstanceUID(studyUid, configManager.getConfig());
            if (!projectId) projectId = parsed.projectId;
            if (!experimentId) experimentId = parsed.experimentId;
          }

          if (!projectId || !experimentId) {
            log.error('XNAT: Missing projectId or experimentId for metadata fetch. Params:', { studyUid, projectId, experimentId, configXnat: configManager.getConfig().xnat });
            return null;
          }

          try {
            const xnatMetadata = await implementation.xnat.getExperimentMetadata(projectId, experimentId);
            if (!xnatMetadata || !xnatMetadata.studies || xnatMetadata.studies.length === 0) {
              log.error('XNAT: No metadata returned from XNAT API or no studies in response.');
              return null;
            }

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
              wadoRoot: configManager.getConfig().wadoRoot,
              ModalitiesInStudy: studyFromXnat.ModalitiesInStudy || (studyFromXnat.series && studyFromXnat.series.length > 0 ? Array.from(new Set(studyFromXnat.series.map(s => s.Modality).filter(Boolean))) : []),
              NumInstances: studyFromXnat.NumInstances || (studyFromXnat.series ? studyFromXnat.series.reduce((acc, s) => acc + (s.instances ? s.instances.length : 0), 0) : 0),
              NumSeries: studyFromXnat.NumSeries || (studyFromXnat.series ? studyFromXnat.series.length : 0),
              xnatTransactionId: xnatMetadata.transactionId,
            };
            DicomMetadataStore.addStudy(studyMetadataForStore);

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
    get store() {
      return storeMethods;
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
      const sourceList = displaySet.instances || displaySet.images;
      const imageIds = [];

      if (!sourceList?.length) {
        return imageIds;
      }

      sourceList.forEach(instance => {
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
        wadoRoot: configManager.getConfig().wadoRoot, // Ensure wadoRoot is present
        wadoUri: configManager.getConfig().wadoUri,   // Ensure wadoUri is present
      };
      const imageId = getImageId({ // Note: getImageId is imported from DicomWebDataSource utils
        instance: instanceForImageId,
        frame,
        config: configManager.getConfig(),
      });
      return imageId;
    },
    getConfig() {
      return configManager.getConfig();
    },
    getStudyInstanceUIDs({ params, query }) {
      const paramsStudyInstanceUIDs = params.StudyInstanceUIDs || params.studyInstanceUIDs;

      // Get all StudyInstanceUIDs from query parameters
      const queryStudyInstanceUIDsRaw = query.getAll('StudyInstanceUIDs').concat(query.getAll('studyInstanceUIDs'));

      // Filter out empty values and trim
      const queryStudyInstanceUIDs = queryStudyInstanceUIDsRaw
        .filter(uid => uid && uid.trim())
        .flatMap(uid => uid.split(',').map(s => s.trim())) // Split by comma in case they're comma-separated
        .filter(uid => uid); // Remove empty strings

      const StudyInstanceUIDs =
        (queryStudyInstanceUIDs.length && queryStudyInstanceUIDs) || paramsStudyInstanceUIDs;
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : StudyInstanceUIDs ? [StudyInstanceUIDs] : [];

      return StudyInstanceUIDsAsArray;
    },
    xnat: xnatApi,
    reject: xnatConfig.supportsReject
      ? dcm4cheeReject(xnatConfig.wadoRoot, configManager.getAuthorizationHeader)
      : () => {
        log.warn('Reject operation is not supported by this XNAT data source.');
        return Promise.reject(new Error('Reject operation is not supported.'));
      },
  };

  // Initialize query and store methods after implementation is fully constructed.
  // Pass configManager so query uses current config after initialize() (e.g. URL projectId/experimentId).
  const queryMethods = new XNATQueryMethods(
    configManager,
    configManager.getQidoClient(),
    configManager.getAuthorizationHeader,
    xnatApi
  );

  const storeMethods = new XNATStoreMethods(configManager);

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
  // 'this' context should be configManager.getQidoClient(), bound in addRetrieveBulkDataNaturalized
  return this.retrieveBulkData(useOptions).then(val => {
    const ret =
      (val instanceof Array && val.find(arrayBuffer => arrayBuffer?.byteLength)) || undefined;
    value.Value = ret; // Store the retrieved ArrayBuffer back into the value object
    return ret;
  });
}

export { createDataSource };
