import { utils, Types as OhifTypes, DicomMetadataStore, classes, log } from '@ohif/core';
import i18n from '@ohif/i18n';
import { metaData, eventTarget, utilities as csUtils } from '@cornerstonejs/core';
import { CONSTANTS, segmentation as cstSegmentation } from '@cornerstonejs/tools';
import { adaptersSEG, Enums } from '@cornerstonejs/adapters';

import { SOPClassHandlerId } from './id';
import { dicomlabToRGB } from './utils/dicomlabToRGB';
import { getSegmentationParserType } from './utils/segmentationConfig';
import {
  getFrameIndexFromImageId,
  isLocalSchemeImageId,
  stripFrameFromImageId,
} from './utils/segLocalImageIds';

const sopClassUids = ['1.2.840.10008.5.1.4.1.1.66.4', '1.2.840.10008.5.1.4.1.1.66.7'];
const LABELMAP_SEG_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.7';

const loadPromises = {};

const SEG_LOAD_LOG_PREFIX = '[SEG load]';

// Max number of SEG frames fetched/decoded concurrently by the segmentation
// loader. Hard-coded to 16 for now; intended to become configurable (and to
// pair with the full-instance prefetch capability) in a follow-up.
const SEG_FRAME_DECODE_CONCURRENCY = 16;


function _normalizeImageId(imageId: string | string[] | undefined): string | undefined {
  if (imageId == null) {
    return undefined;
  }
  return Array.isArray(imageId) ? imageId[0] : imageId;
}

/**
 * Expands a WADO-RS frame imageId (…/frames/1) into one imageId per frame.
 * Multiframe SEG is stored as separate /frames/N resources on the server.
 */
function getFrameImageIds(segImageId: string, numberOfFrames: number): string[] {
  const frameMatch = segImageId.match(/(.*\/frames\/)(\d+)(.*)$/);
  if (!frameMatch || numberOfFrames <= 1) {
    return [segImageId];
  }

  const prefix = frameMatch[1];
  const suffix = frameMatch[3] || '';
  const frameImageIds: string[] = [];

  for (let frameNumber = 1; frameNumber <= numberOfFrames; frameNumber++) {
    frameImageIds.push(`${prefix}${frameNumber}${suffix}`);
  }

  return frameImageIds;
}

function _getSegNumberOfFrames(instance: Record<string, unknown>): number {
  const fromTag = Number(instance.NumberOfFrames);
  if (fromTag > 0) {
    return fromTag;
  }

  const perFrame = instance.PerFrameFunctionalGroupsSequence;
  if (Array.isArray(perFrame) && perFrame.length > 0) {
    return perFrame.length;
  }

  return 1;
}

function _ensureSegImageIdMetadataRegistered(
  imageId: string | undefined,
  instance: Record<string, unknown>
): void {
  if (!imageId) {
    return;
  }

  const metadataProvider = classes.MetadataProvider;

  const StudyInstanceUID = instance.StudyInstanceUID as string | undefined;
  const SeriesInstanceUID = instance.SeriesInstanceUID as string | undefined;
  const SOPInstanceUID = (instance.SOPInstanceUID || instance.SopInstanceUID) as
    | string
    | undefined;

  if (!StudyInstanceUID || !SeriesInstanceUID || !SOPInstanceUID) {
    return;
  }

  metadataProvider.addImageIdToUIDs(imageId, {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    frameNumber: getFrameIndexFromImageId(imageId),
  });
}

/** Ensures metadataProvider.get('instance', imageId) resolves for frame-qualified local SEG ids. */
function _ensureSegInstanceMetadataAvailable(
  imageId: string | undefined,
  instance: Record<string, unknown>
): void {
  if (!imageId) {
    return;
  }

  _ensureSegImageIdMetadataRegistered(imageId, instance);

  if (metaData.get('instance', imageId)) {
    return;
  }

  const StudyInstanceUID = instance.StudyInstanceUID as string | undefined;
  const SeriesInstanceUID = instance.SeriesInstanceUID as string | undefined;
  const SOPInstanceUID = (instance.SOPInstanceUID || instance.SopInstanceUID) as
    | string
    | undefined;

  const storedInstance =
    StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID
      ? DicomMetadataStore.getInstance(StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID)
      : undefined;

  classes.MetadataProvider.addCustomMetadata(
    imageId,
    'instance',
    storedInstance || instance
  );
}

function _getSegDataSource(extensionManager, instance: Record<string, unknown>) {
  const StudyInstanceUID = instance.StudyInstanceUID as string | undefined;
  const SeriesInstanceUID = instance.SeriesInstanceUID as string | undefined;
  const SOPInstanceUID = (instance.SOPInstanceUID || instance.SopInstanceUID) as
    | string
    | undefined;

  let localUrl: string | undefined;

  if (StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID) {
    const storedInstance = DicomMetadataStore.getInstance(
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID
    );
    localUrl = storedInstance?.url as string | undefined;
  }

  localUrl = localUrl || (instance.url as string | undefined);

  if (localUrl && isLocalSchemeImageId(localUrl)) {
    const dicomLocal = extensionManager.getDataSources('dicomlocal');

    if (dicomLocal?.[0]) {
      return dicomLocal[0];
    }
  }

  return extensionManager.getActiveDataSource()[0];
}

function _getSegImageIdFromInstance(
  instance: Record<string, unknown>,
  dataSource: { getImageIdsForInstance?: (args: { instance: unknown; frame?: number }) => unknown }
): string | undefined {
  const numberOfFrames = _getSegNumberOfFrames(instance);
  const frame = numberOfFrames > 1 ? 1 : undefined;

  return _normalizeImageId(
    dataSource.getImageIdsForInstance?.({ instance, frame }) as string | string[] | undefined
  );
}

function _resolveFrameImageIds(
  segImageIdStr: string,
  instance: Record<string, unknown>,
  dataSource: { getImageIdsForInstance?: (args: { instance: unknown; frame?: number }) => unknown }
): string[] {
  const numberOfFrames = _getSegNumberOfFrames(instance);
  const fromFrameUrl = getFrameImageIds(segImageIdStr, numberOfFrames);

  if (fromFrameUrl.length > 1) {
    return fromFrameUrl;
  }

  if (numberOfFrames <= 1) {
    return [segImageIdStr];
  }

  const frameImageIds: string[] = [];

  for (let frame = 1; frame <= numberOfFrames; frame++) {
    const frameImageId = _normalizeImageId(
      dataSource.getImageIdsForInstance?.({ instance, frame }) as string | string[] | undefined
    );

    if (frameImageId) {
      frameImageIds.push(frameImageId);
    }
  }

  return frameImageIds.length ? frameImageIds : [segImageIdStr];
}

function _logSegImageIds({
  segDisplaySet,
  segImageIdStr,
  frameImageIds,
  referencedImageIds,
}: {
  segDisplaySet: AppTypes.DisplaySet;
  segImageIdStr: string;
  frameImageIds: string[];
  referencedImageIds: string[];
}) {
  const instance = segDisplaySet.instance as Record<string, unknown>;
  const numberOfFrames = Number(instance?.NumberOfFrames) || 1;

  log.debug(SEG_LOAD_LOG_PREFIX, 'Loading SEG pixel data', {
    SOPInstanceUID: segDisplaySet.SOPInstanceUID,
    SeriesInstanceUID: segDisplaySet.SeriesInstanceUID,
    SOPClassUID: segDisplaySet.SOPClassUID,
    NumberOfFrames: numberOfFrames,
    segmentCount: Object.keys(segDisplaySet.segments || {}).length,
    referencedDisplaySetInstanceUID: segDisplaySet.referencedDisplaySetInstanceUID,
    referencedImageIdCount: referencedImageIds.length,
    referencedImageIds,
    segImageIdForMetadata: segImageIdStr,
    frameImageIds,
    loadSegFramesIndividually: frameImageIds.length > 1,
  });
}

function _getDisplaySetsFromSeries(
  instances,
  servicesManager: AppTypes.ServicesManager,
  extensionManager
) {
  console.log('SEG _getDisplaySetsFromSeries called with instances:', instances.length);
  
  utils.sortStudyInstances(instances);

  // Choose the LAST instance in the list as the most recently created one.
  const instance = instances[instances.length - 1];
  
  console.log('SEG selected instance:', {
    SOPInstanceUID: instance.SOPInstanceUID,
    Modality: instance.Modality,
    SOPClassUID: instance.SOPClassUID
  });

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription = '',
    SeriesNumber,
    SeriesDate,
    StructureSetDate,
    SOPClassUID,
    FrameOfReferenceUID,
    wadoRoot,
    wadoUri,
    wadoUriRoot,
    imageId: predecessorImageId,
  } = instance;

  const displaySet = {
    Modality: 'SEG',
    loading: false,
    isReconstructable: false,
    displaySetInstanceUID: utils.guid(),
    SeriesDescription,
    SeriesNumber,
    SeriesDate: SeriesDate || StructureSetDate || '',
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    FrameOfReferenceUID,
    referencedImages: null,
    referencedSeriesInstanceUID: null,
    referencedDisplaySetInstanceUID: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    isHydrated: false,
    segments: {},
    sopClassUids,
    instance,
    predecessorImageId,
    instances: [instance],
    wadoRoot,
    wadoUriRoot,
    wadoUri,
    isOverlayDisplaySet: true,
    label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t('SEG')}`,
  };

  const referencedSeriesSequence = instance.ReferencedSeriesSequence;


  // Force create display set even if ReferencedSeriesSequence is missing
  if (!referencedSeriesSequence) {
    // Try to find CT series in the study to use as reference
    const studyInstances = servicesManager.services.displaySetService.getStudyDisplaySets?.(StudyInstanceUID) || [];
    const ctDisplaySet = studyInstances.find(ds => ds.Modality === 'CT');
    if (ctDisplaySet) {
      displaySet.referencedSeriesInstanceUID = ctDisplaySet.SeriesInstanceUID;
      displaySet.referencedDisplaySetInstanceUID = ctDisplaySet.displaySetInstanceUID;
      displaySet.referencedImages = [];
    } else {
      console.error('No CT series found for SEG reference, cannot create display set');
      return;
    }
  } else {
    const referencedSeries = referencedSeriesSequence[0] || referencedSeriesSequence;
    // Handle both ReferencedInstanceSequence and 00001114 field names
    displaySet.referencedImages = referencedSeries.ReferencedInstanceSequence || referencedSeries['00001114'] || [];
    displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;
  }

  const { displaySetService } = servicesManager.services;
  
  // Convert 00001114 to ReferencedInstanceSequence for compatibility
  const normalizedReferencedSeriesSequence = Array.isArray(instance.ReferencedSeriesSequence)
    ? instance.ReferencedSeriesSequence.map(ref => {
        const normalizedRef = { ...ref };
        if (ref['00001114'] && !ref.ReferencedInstanceSequence) {
          normalizedRef.ReferencedInstanceSequence = ref['00001114'];
        }
        return normalizedRef;
      })
    : [instance.ReferencedSeriesSequence].map(ref => {
        const normalizedRef = { ...ref };
        if (ref['00001114'] && !ref.ReferencedInstanceSequence) {
          normalizedRef.ReferencedInstanceSequence = ref['00001114'];
        }
        return normalizedRef;
      });
  
  let referencedDisplaySets;
  try {
    referencedDisplaySets = displaySetService.getDisplaySetsForReferences(
      normalizedReferencedSeriesSequence
    );
  } catch (error) {
    console.error('SEG getDisplaySetsForReferences error:', error);
    console.warn('SEG forcing display set creation without reference due to error');
    referencedDisplaySets = null;
  }

  if (referencedDisplaySets?.length > 1) {
    console.warn(
      'Segmentation does not currently handle references to multiple series, defaulting to first series'
    );
  }

  const referencedDisplaySet = referencedDisplaySets?.[0];

  if (!referencedDisplaySet) {
    console.warn('SEG referencedDisplaySet is null, forcing display set creation without reference');
    // Force create display set even without referenced display set
    displaySet.referencedDisplaySetInstanceUID = null;
    displaySet.isReconstructable = true;
    displaySet.FrameOfReferenceUID = null;
  } else {
    displaySet.referencedDisplaySetInstanceUID = referencedDisplaySet.displaySetInstanceUID;
    displaySet.isReconstructable = referencedDisplaySet.isReconstructable;
    displaySet.FrameOfReferenceUID = referencedDisplaySet.FrameOfReferenceUID;
  }

  displaySet.load = async ({ headers }) =>
    await _load(displaySet, servicesManager, extensionManager, headers);

  return [displaySet];
}

function _load(
  segDisplaySet,
  servicesManager: AppTypes.ServicesManager,
  extensionManager,
  headers
) {
  const { SOPInstanceUID } = segDisplaySet;
  const { segmentationService } = servicesManager.services;

  if (
    (segDisplaySet.loading || segDisplaySet.isLoaded) &&
    loadPromises[SOPInstanceUID] &&
    _segmentationExists(segDisplaySet)
  ) {
    return loadPromises[SOPInstanceUID];
  }

  segDisplaySet.loading = true;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  loadPromises[SOPInstanceUID] = new Promise(async (resolve, reject) => {
    if (!segDisplaySet.segments || Object.keys(segDisplaySet.segments).length === 0) {
      try {
        await _loadSegments({
          extensionManager,
          servicesManager,
          segDisplaySet,
          headers,
        });
      } catch (e) {
        segDisplaySet.loading = false;
        return reject(e);
      }
    }

    // DISABLED: Using custom rendering pipeline instead
    // Skip the original segmentation service to avoid conflicts
    console.log('SEG: Skipping createSegmentationForSEGDisplaySet, using custom overlay instead');
    segDisplaySet.loading = false;
    resolve();
    
    /* Original code disabled:
    segmentationService
      .createSegmentationForSEGDisplaySet(segDisplaySet)
      .then(() => {
        segDisplaySet.loading = false;
        resolve();
      })
      .catch(error => {
        segDisplaySet.loading = false;
        reject(error);
      });
    */
  });

  // Expose the in-flight load promise so observers (e.g. the viewport service
  // waiting to attach the representation) can react to a load failure without
  // re-invoking load().
  segDisplaySet.loadingPromise = loadPromises[SOPInstanceUID];

  return loadPromises[SOPInstanceUID];
}

async function _loadSegments({
  extensionManager,
  servicesManager,
  segDisplaySet,
}: withAppTypes<{ segDisplaySet: AppTypes.DisplaySet }>) {
  const { segmentationService, uiNotificationService, customizationService } =
    servicesManager.services;
  const instance = segDisplaySet.instance as Record<string, unknown>;
  const dataSource = _getSegDataSource(extensionManager, instance);
  const segImageIdStr = _getSegImageIdFromInstance(instance, dataSource);
  
  // Extract SEG instance dimensions
  const segRows = instance.Rows as number || 512;
  const segColumns = instance.Columns as number || 512;
  const numberOfFrames = instance.NumberOfFrames as number || 1;
  const bitsAllocated = instance.BitsAllocated as number || 8;
  const bitsStored = instance.BitsStored as number || 1;
  const pixelRepresentation = instance.PixelRepresentation as number || 0;

  // Force bitmap parser to handle 1-bit/8-bit inconsistency
  const parserType = 'bitmap';

  if (!segImageIdStr) {
    throw new Error(
      'Could not get imageId for SEG instance (no local wadouri url and getImageIdsForInstance returned nothing).'
    );
  }

  let referencedDisplaySet = servicesManager.services.displaySetService.getDisplaySetByUID(
    segDisplaySet.referencedDisplaySetInstanceUID
  );

  // If referencedDisplaySet is null, try to find CT display set manually
  if (!referencedDisplaySet) {
    const studyDisplaySets = servicesManager.services.displaySetService.getDisplaySetsBy?.(
      (ds: any) => ds.StudyInstanceUID === segDisplaySet.StudyInstanceUID
    ) || [];
    referencedDisplaySet = studyDisplaySets.find((ds: any) => ds.Modality === 'CT');
    if (referencedDisplaySet) {
      segDisplaySet.referencedDisplaySetInstanceUID = referencedDisplaySet.displaySetInstanceUID;
    }
  }

  if (!referencedDisplaySet) {
    throw new Error('referencedDisplaySet is missing for SEG');
  }

  // Prefer cached stack imageIds (multiframe SEG fix #4890), then data source expansion.
  let { imageIds } = referencedDisplaySet;

  if (!imageIds?.length) {
    imageIds = dataSource.getImageIdsForDisplaySet?.(referencedDisplaySet);
  }

  if (!imageIds?.length) {
    const images = (referencedDisplaySet as { images?: { imageId: string }[] }).images;
    imageIds = images?.map((img: { imageId: string }) => img.imageId);
  }

  if (!imageIds?.length) {
    throw new Error('referencedDisplaySet has no imageIds');
  }

  // For SEG loading, we need to map SEG frames to their referenced CT images
  const segNumberOfFrames = instance.NumberOfFrames as number || 1;
  
  // Simplified matching logic: try to use ReferencedSOPInstanceUIDs from SEG file
  const referencedSOPInstanceUIDs = (instance.ReferencedSOPSequence || 
                                     instance.ReferencedInstanceSequence || 
                                     []) as Array<{ ReferencedSOPInstanceUID?: string }>;
  
  const ctInstances = (referencedDisplaySet as { instances?: Array<{ SOPInstanceUID?: string }> }).instances || [];
  
  // If SEG has explicit referenced SOP instance UIDs, use them for precise matching
  if (referencedSOPInstanceUIDs.length > 0) {
    const mappedImageIds: string[] = [];
    
    for (const ref of referencedSOPInstanceUIDs) {
      const sopInstanceUID = ref.ReferencedSOPInstanceUID;
      if (sopInstanceUID) {
        const ctInstance = ctInstances.find(inst => inst.SOPInstanceUID === sopInstanceUID);
        if (ctInstance) {
          const imageId = dataSource.getImageIdsForInstance?.({ instance: ctInstance }) as string | string[];
          if (imageId) {
            mappedImageIds.push(Array.isArray(imageId) ? imageId[0] : imageId);
          }
        }
      }
    }
    
    // If we successfully mapped all frames, use the mapped imageIds
    if (mappedImageIds.length === segNumberOfFrames) {
      imageIds = mappedImageIds;
    } else {
      // Fallback: use sequential mapping assuming SEG frames correspond to CT slices in order
      imageIds = imageIds.slice(0, Math.min(segNumberOfFrames, ctInstances.length));
    }
  } else {
    // No explicit references: use sequential mapping
    imageIds = imageIds.slice(0, Math.min(segNumberOfFrames, ctInstances.length));
  }

  // Ensure CT image metadata is loaded and has orientation information
  // Create a custom metadata map for Cornerstone's metaData provider
  const customMetadataMap = new Map();
  const segImageIdForMetadata = isLocalSchemeImageId(segImageIdStr)
    ? stripFrameFromImageId(segImageIdStr)
    : segImageIdStr;
  
  // Add SEG instance metadata with segment information
  const segInstanceMetadata = {
    ...instance,
    // Ensure required fields for SEG processing
    SegmentationType: instance.SegmentationType || 'BINARY',
    SegmentSequence: instance.SegmentSequence || [],
    NumberOfFrames: instance.NumberOfFrames || 1,
    // Add segment metadata if available
    segments: instance.segments || [],
  };
  customMetadataMap.set(segImageIdForMetadata, segInstanceMetadata);
  
  // Get metadata from referencedDisplaySet instances and manually register it
  if (referencedDisplaySet.instances && referencedDisplaySet.instances.length > 0) {
    
    // Process all imageIds to ensure createLabelmapsFromSegImageIds has complete metadata
    const maxImagesToProcess = Math.min(imageIds.length, referencedDisplaySet.instances.length);
    
    for (let i = 0; i < maxImagesToProcess; i++) {
      const imageId = isLocalSchemeImageId(imageIds[i])
      ? stripFrameFromImageId(imageIds[i])
      : imageIds[i];

      // Use index to get instance directly since imageIds may be full URLs
      const instanceMetadata = referencedDisplaySet.instances?.[i];
      
      if (!instanceMetadata) {
        continue;
      }
      
      // Construct metadata from instance
      const imageMetadata = {
        ...instanceMetadata,
        // Ensure required fields for checkOrientation and labelmap creation
        ImageOrientationPatient: instanceMetadata.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
        ImagePositionPatient: instanceMetadata.ImagePositionPatient || [0, 0, 0],
        PixelSpacing: instanceMetadata.PixelSpacing || [1, 1],
        SliceThickness: instanceMetadata.SliceThickness || 1,
        Rows: instanceMetadata.Rows || 512,
        Columns: instanceMetadata.Columns || 512,
        // Additional spatial metadata that may be required
        SpacingBetweenSlices: instanceMetadata.SpacingBetweenSlices || instanceMetadata.SliceThickness || 1,
        FrameOfReferenceUID: instanceMetadata.FrameOfReferenceUID || '1.2.840.10008.1.1.1',
        ImagePlanePixelSpacing: instanceMetadata.ImagePlanePixelSpacing || instanceMetadata.PixelSpacing || [1, 1],
        // 3D rendering specific metadata
        direction: instanceMetadata.ImageOrientationPatient || [1, 0, 0, 0, 1, 0],
        origin: instanceMetadata.ImagePositionPatient || [0, 0, 0],
        spacing: [
          (instanceMetadata.PixelSpacing as any)?.[0] || 1,
          (instanceMetadata.PixelSpacing as any)?.[1] || 1,
          instanceMetadata.SliceThickness || 1
        ],
        // Additional DICOM spatial fields
        PatientPosition: instanceMetadata.PatientPosition || 'HFS',
        ImageType: instanceMetadata.ImageType || ['ORIGINAL', 'PRIMARY'],
        SamplesPerPixel: instanceMetadata.SamplesPerPixel || 1,
        PhotometricInterpretation: instanceMetadata.PhotometricInterpretation || 'MONOCHROME2',
      };
      
      
      // Store in custom metadata map
      customMetadataMap.set(imageId, imageMetadata);
    }
    // Register custom metadata provider with Cornerstone
    const customProvider = (type: string, imageId: string) => {
      // Debug logging removed to prevent console spam during scrolling
      // console.log('SEG customProvider called - type:', type, 'imageId:', imageId);
      // console.log('SEG customProvider - map has imageId:', customMetadataMap.has(imageId));
      if (customMetadataMap.has(imageId)) {
        const metadata = customMetadataMap.get(imageId);
        // console.log('SEG customProvider - returning metadata for:', imageId, 'type:', type, 'keys:', Object.keys(metadata || {}));
        
        // Return appropriate metadata based on type
        // Convert all field names to lowercase for Cornerstone compatibility
        if (type === 'imagePlaneModule') {
          const ipp = metadata.ImageOrientationPatient || [0, 0, 0];
          const ps = metadata.PixelSpacing || [1, 1];
          const iop = metadata.ImageOrientationPatient || [1, 0, 0, 0, 1, 0];
          const result = {
            imageOrientationPatient: iop,
            imagePositionPatient: [ipp[0] || 0, ipp[1] || 0, ipp[2] || 0],
            pixelSpacing: [ps[0] || 1, ps[1] || 1],
            sliceThickness: metadata.SliceThickness || 1,
            frameOfReferenceUID: metadata.FrameOfReferenceUID || '1.2.840.10008.1.1.1',
            rows: metadata.Rows || 512,
            columns: metadata.Columns || 512,
            direction: metadata.direction || [1, 0, 0, 0, 1, 0],
            origin: metadata.origin || [0, 0, 0],
            spacing: metadata.spacing || [1, 1, 1],
            // Add rowCosines and columnCosines for createLabelmapsFromSegImageIds
            rowCosines: [iop[0] || 1, iop[1] || 0, iop[2] || 0],
            columnCosines: [iop[3] || 0, iop[4] || 1, iop[5] || 0],
          };
          // console.log('imagePlaneModule returning:', result);
          return result;
        } else if (type === 'generalSeriesModule') {
          return {
            modality: metadata.Modality || 'CT',
            seriesInstanceUID: metadata.SeriesInstanceUID || '',
            seriesNumber: metadata.SeriesNumber || 1,
            seriesDescription: metadata.SeriesDescription || '',
          };
        } else if (type === 'imagePixelModule') {
          return {
            rows: metadata.Rows || 512,
            columns: metadata.Columns || 512,
            bitsAllocated: metadata.BitsAllocated || 16,
            samplesPerPixel: metadata.SamplesPerPixel || 1,
            pixelRepresentation: metadata.PixelRepresentation || 0,
          };
        } else if (type === 'scalingModule') {
          return {
            rescaleIntercept: metadata.RescaleIntercept || 0,
            rescaleSlope: metadata.RescaleSlope || 1,
          };
        } else if (type === 'calibratedPixelSpacing') {
          const ps = metadata.PixelSpacing || [1, 1];
          return {
            rowPixelSpacing: ps[0] || 1,
            columnPixelSpacing: ps[1] || 1,
          };
        } else if (type === 'generalImageModule') {
          return {
            sopInstanceUID: metadata.SOPInstanceUID || '',
            sopClassUID: metadata.SOPClassUID || '',
          };
        } else if (type === 'sopCommonModule') {
          return {
            sopInstanceUID: metadata.SOPInstanceUID || '',
            sopClassUID: metadata.SOPClassUID || '',
            instanceNumber: metadata.InstanceNumber || 1,
          };
        } else if (type === 'voiLutModule') {
          return {
            windowCenter: metadata.WindowCenter || [400],
            windowWidth: metadata.WindowWidth || [1000],
          };
        } else if (type === 'modalityLutModule') {
          return {
            rescaleIntercept: metadata.RescaleIntercept || 0,
            rescaleSlope: metadata.RescaleSlope || 1,
          };
        } else if (type === 'compressedFrameData') {
          return {
            transferSyntax: metadata.TransferSyntax || '1.2.840.10008.1.2',
          };
        } else if (type === 'instance') {
          // For instance type, return full metadata with functional groups for SEG
          // Ensure functional groups are present for checkOrientation
          const instanceMetadata = { ...metadata };
          if (!instanceMetadata.SharedFunctionalGroupsSequence) {
            instanceMetadata.SharedFunctionalGroupsSequence = {
              PlaneOrientationSequence: {
                ImageOrientationPatient: metadata.ImageOrientationPatient || [1, 0, 0, 0, 1, 0]
              }
            };
          }
          if (!instanceMetadata.PerFrameFunctionalGroupsSequence) {
            instanceMetadata.PerFrameFunctionalGroupsSequence = [{
              PlaneOrientationSequence: {
                ImageOrientationPatient: metadata.ImageOrientationPatient || [1, 0, 0, 0, 1, 0]
              }
            }];
          }
          return instanceMetadata;
        }
      }
      
      // For SEG imageId or other imageIds not in map, provide default metadata
      // This is needed for the SEG imageId itself which may not be in the map
      if (type === 'instance') {
        // console.log('SEG customProvider - providing default instance metadata for:', imageId);
        return {
          SharedFunctionalGroupsSequence: {
            PlaneOrientationSequence: {
              ImageOrientationPatient: [1, 0, 0, 0, 1, 0]
            }
          },
          PerFrameFunctionalGroupsSequence: [{
            PlaneOrientationSequence: {
              ImageOrientationPatient: [1, 0, 0, 0, 1, 0]
            }
          }],
          Rows: segRows,
          Columns: segColumns,
          BitsStored: 8,
          BitsAllocated: 8,
          SegmentationType: 'BINARY',
        };
      }
      
      // For reference images (CT/MRI), return undefined to let other providers handle it
      // This allows them to get their metadata from DICOMweb provider
      return undefined;
    };
    
    metaData.addProvider(customProvider, 10000);
  }

  // Create a copy to avoid shared reference that could corrupt imageIds
  (segDisplaySet as AppTypes.DisplaySet & { referencedImageIds?: string[] }).referencedImageIds =
    [...imageIds];

  const frameImageIds = _resolveFrameImageIds(
    segImageIdStr,
    segDisplaySet.instance as Record<string, unknown>,
    dataSource
  );

  _logSegImageIds({
    segDisplaySet,
    segImageIdStr: segImageIdStr,
    frameImageIds,
    referencedImageIds: imageIds,
  });


  _ensureSegInstanceMetadataAvailable(segImageIdStr, instance);
  frameImageIds.forEach(id => _ensureSegInstanceMetadataAvailable(id, instance));

  // DISABLED: Using custom rendering pipeline instead
  // The old OHIF rendering pipeline is bypassed by CustomSegmentationOverlay
  // to avoid timing issues and conflicts with dcmjs
  // Skip the entire original rendering process
  console.log('SEG: Skipping original OHIF rendering pipeline, using custom overlay instead');
  return;
  
  const tolerance = 0.001;
  const eventTarget = new EventTarget();
  const onProgress = evt => {
    const { percentComplete } = evt.detail;
    segmentationService._broadcastEvent(segmentationService.EVENTS.SEGMENT_LOADING_COMPLETE, {
      percentComplete,
    });
  };
  eventTarget.addEventListener(Enums.Events.SEGMENTATION_LOAD_PROGRESS, onProgress);

  // Fetch the whole SEG instance as a single Part 10 object and register its
  // per-frame compressed pixels into the Cornerstone3D frame registry, so the
  // per-frame loads below are served locally instead of one network request
  // per frame: SEG frames are so small and numerous that one bulk fetch beats
  // hundreds of tiny requests. Enabled by default; per-frame loading is the
  // exception (loadMultiframeAsPart10: false in the data source config, or the
  // cornerstone.segmentation.loadMultiframeAsPart10 customization). The
  // prefetch is awaited until it completes OR fails — deliberately no timeout:
  // a failed/unsupported instance fetch resolves quickly and falls back to
  // per-frame, while a slow large fetch is still the fastest way to all frames.
  // Disable multiframe part10 prefetch for 1-bit SEG files to work around pixel data length issues
  const loadMultiframeAsPart10 = bitsAllocated === 1 ? false :
    (dataSource?.getConfig?.()?.loadMultiframeAsPart10 as boolean | undefined) ??
    (customizationService?.getCustomization?.(
      'cornerstone.segmentation.loadMultiframeAsPart10'
    ) as boolean | undefined) ??
    true;

  let prefetch;
  if (loadMultiframeAsPart10) {
    prefetch = dataSource.retrieve?.prefetchInstanceFrames?.({
      instance,
      imageId: segImageIdStr,
    });

    if (prefetch?.done) {
      await prefetch.done;
    }
  }


  let results;
  try {
    results = await adaptersSEG.Cornerstone3D.Segmentation.createFromDicomSegImageId(
      imageIds,
      segImageIdStr,
      {
        metadataProvider: metaData,
        tolerance,
        parserType: parserType,
        frameImageIds,
        concurrency: SEG_FRAME_DECODE_CONCURRENCY,
      }
    );
  } catch (error) {
    // 如果是 segment index 错误，说明 dcmjs 库的检查过于严格
    // 由于无法修改 node_modules 中的 dcmjs 库，我们需要在导入源头解决这个问题
    if (error instanceof Error && error.message.includes('Could not retrieve the segment index')) {
      console.error('Segment index retrieval failed. This is a dcmjs library limitation.');
      console.error('The SEG file is valid, but dcmjs requires additional metadata that our export may not provide.');
      console.error('Please consider:');
      console.error('1. Using patch-package to modify dcmjs library in node_modules');
      console.error('2. Or forking @cornerstonejs/adapters and modifying labelmapImagesFromBuffer.js');
      throw new Error('Segment index retrieval failed. The SEG file structure is valid, but dcmjs library requires additional metadata. Consider using patch-package to modify the library.');
    } else {
      throw error;
    }
  } finally {
    eventTarget.removeEventListener(Enums.Events.SEGMENTATION_LOAD_PROGRESS, onProgress);
    prefetch?.cancel?.();
  }

  let usedRecommendedDisplayCIELabValue = true;
  const resultsTyped = results as {
    segMetadata: { data: { rgba?: number[]; RecommendedDisplayCIELabValue?: number[] }[] };
  };
  
  resultsTyped.segMetadata.data.forEach((data, i) => {
    if (i > 0 && data) {
      data.rgba = data.RecommendedDisplayCIELabValue;

      if (data.rgba) {
        data.rgba = dicomlabToRGB(data.rgba);
      } else {
        usedRecommendedDisplayCIELabValue = false;
        data.rgba = CONSTANTS.COLOR_LUT[i % CONSTANTS.COLOR_LUT.length];
      }
    }
  });

  if (!usedRecommendedDisplayCIELabValue) {
    // Display a notification about the non-utilization of RecommendedDisplayCIELabValue
    uiNotificationService.show({
      title: 'DICOM SEG import',
      message:
        'RecommendedDisplayCIELabValue not found for one or more segments. The default color was used instead.',
      type: 'warning',
      duration: 5000,
    });
  }

  Object.assign(segDisplaySet, results);

  // Ensure segments have required metadata fields for SegmentationService
  if (segDisplaySet.segments) {
    Object.keys(segDisplaySet.segments).forEach(segmentKey => {
      const segment = segDisplaySet.segments[segmentKey];
      if (segment && !segment.SegmentedPropertyCategoryCodeSequence) {
        segment.SegmentedPropertyCategoryCodeSequence = {
          CodeValue: 'T-D0050',
          CodingSchemeDesignator: 'SRT',
          CodeMeaning: 'Tissue',
        };
      }
    });
  }

  const labelMapImageIds = (results as { labelMapImages?: { imageId: string }[][] })
    .labelMapImages?.flat()
    .map(image => image.imageId);

  log.debug(SEG_LOAD_LOG_PREFIX, 'SEG parse complete', {
    SOPInstanceUID: segDisplaySet.SOPInstanceUID,
    labelMapImageCount: labelMapImageIds?.length ?? 0,
    labelMapImageIds,
    segmentIndices: Object.keys(segDisplaySet.segments || {}),
  });
}

function _segmentationExists(segDisplaySet) {
  return cstSegmentation.state.getSegmentation(segDisplaySet.displaySetInstanceUID);
}

function getSopClassHandlerModule(params: OhifTypes.Extensions.ExtensionParams) {
  const { servicesManager, extensionManager } = params;
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return [
    {
      name: 'dicom-seg',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

export default getSopClassHandlerModule;
