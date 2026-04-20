import { utils, classes } from '@ohif/core';
import { createNiftiImageIdsAndCacheMetadata } from '@cornerstonejs/nifti-volume-loader';
import i18n from '@ohif/i18n';
import { id } from './id';
import getDisplaySetMessages from './getDisplaySetMessages';
import getDisplaySetsFromUnsupportedSeries from './getDisplaySetsFromUnsupportedSeries';
import { chartHandler } from './SOPClassHandlers/chartSOPClassHandler';
import { metaData } from '@cornerstonejs/core';

const { isImage, sortStudyInstances, sopClassDictionary, isDisplaySetReconstructable } = utils;
const { ImageSet } = classes;

const DEFAULT_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';
const sopClassHandlerName = 'stack';
let appContext = {};

const isAbsolutePathOrUrl = value =>
  typeof value === 'string' &&
  (/^[a-z]+:\/\//i.test(value) || value.startsWith('//') || value.startsWith('/'));

const joinUrl = (baseUrl, path) => {
  if (!baseUrl) {
    return path;
  }

  try {
    return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
  } catch (error) {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${normalizedBaseUrl}${path.replace(/^\/+/, '')}`;
  }
};

const getDynamicVolumeInfo = instances => {
  const { extensionManager } = appContext;

  if (!extensionManager) {
    throw new Error('extensionManager is not available');
  }

  const imageIds = instances.map(({ imageId }) => imageId);
  const volumeLoaderUtility = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.volumeLoader'
  );
  const { getDynamicVolumeInfo: csGetDynamicVolumeInfo } = volumeLoaderUtility.exports;

  return csGetDynamicVolumeInfo(imageIds);
};

const isMultiFrame = instance => {
  return instance.NumberOfFrames > 1;
};

function getDisplaySetInfo(instances) {
  const dynamicVolumeInfo = getDynamicVolumeInfo(instances);
  const { isDynamicVolume, timePoints } = dynamicVolumeInfo;
  let displaySetInfo;

  const { appConfig } = appContext;

  if (isDynamicVolume) {
    const timePoint = timePoints[0];
    const instancesMap = new Map();

    let firstTimePointInstances;

    if (instances[0].NumberOfFrames > 1 && timePoints.length > 1) {
      // Handle multiframe dynamic volumes. Local file frame imageIds do not
      // always resolve to a frame-level instance object, so keep resolved
      // entries and fall back to the source multiframe instance when needed.
      firstTimePointInstances = timePoints[0]
        .map(imageId => metaData.get('instance', imageId))
        .filter(Boolean);

      if (!firstTimePointInstances.length) {
        firstTimePointInstances = [instances[0]];
      }
    } else {
      // O(n) to convert it into a map and O(1) to find each instance
      instances.forEach(instance => instancesMap.set(instance.imageId, instance));
      firstTimePointInstances = timePoint.map(imageId => instancesMap.get(imageId)).filter(Boolean);
    }
    displaySetInfo = isDisplaySetReconstructable(firstTimePointInstances, appConfig);
  } else {
    displaySetInfo = isDisplaySetReconstructable(instances, appConfig);
  }

  return {
    isDynamicVolume,
    ...displaySetInfo,
    dynamicVolumeInfo,
  };
}

const makeDisplaySet = (instances, index) => {
  // Need to sort the instances in order to get a consistent instance/thumbnail
  sortStudyInstances(instances);
  const instance = instances[0];
  const imageSet = new ImageSet(instances);
  const { extensionManager } = appContext;
  const dataSource = extensionManager.getActiveDataSource()[0];
  const {
    isDynamicVolume,
    value: isReconstructable,
    averageSpacingBetweenFrames,
    dynamicVolumeInfo,
  } = getDisplaySetInfo(instances);

  const volumeLoaderSchema = isDynamicVolume
    ? DYNAMIC_VOLUME_LOADER_SCHEME
    : DEFAULT_VOLUME_LOADER_SCHEME;

  // set appropriate attributes to image set...
  const messages = getDisplaySetMessages(instances, isReconstructable, isDynamicVolume);

  const { niftiPrivateTagName, niftiBaseUrl } = dataSource.getConfig?.() || {};
  const niftiPath = niftiPrivateTagName ? instance[niftiPrivateTagName] : undefined;
  let niftiURL;

  if (typeof niftiPath === 'string' && niftiPath.trim().length > 0) {
    niftiURL = isAbsolutePathOrUrl(niftiPath) ? niftiPath : joinUrl(niftiBaseUrl, niftiPath);
  }

  imageSet.setAttributes({
    volumeLoaderSchema,
    displaySetInstanceUID: imageSet.uid, // create a local alias for the imageSet UID
    SeriesDate: instance.SeriesDate,
    SeriesTime: instance.SeriesTime,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    SeriesNumber: instance.SeriesNumber || 0,
    FrameRate: instance.FrameTime,
    SOPClassUID: instance.SOPClassUID,
    SeriesDescription: instance.SeriesDescription || '',
    Modality: instance.Modality,
    isMultiFrame: isMultiFrame(instance),
    countIcon: isReconstructable ? 'icon-mpr' : undefined,
    numImageFrames: instances.length,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${sopClassHandlerName}`,
    isReconstructable,
    messages,
    averageSpacingBetweenFrames: averageSpacingBetweenFrames || null,
    isDynamicVolume,
    dynamicVolumeInfo,
    supportsWindowLevel: true,
    label:
      instance.SeriesDescription ||
      `${i18n.t('Series')} ${instance.SeriesNumber} - ${i18n.t(instance.Modality)}`,
    FrameOfReferenceUID: instance.FrameOfReferenceUID,
  });

  if (niftiURL) {
    // If a downstream integration already exposes a NIfTI URL on the series,
    // pass through the DICOM-derived metadata that a paired loader-side
    // implementation can consume for VOI and series registration.
    const dicomMetadata = {
      Modality: instance.Modality,
      SeriesInstanceUID: instance.SeriesInstanceUID,
      SeriesNumber: instance.SeriesNumber,
      SeriesDescription: instance.SeriesDescription,
      WindowCenter: instance.WindowCenter,
      WindowWidth: instance.WindowWidth,
      VOILUTFunction: instance.VOILUTFunction,
      RescaleSlope: instance.RescaleSlope,
      RescaleIntercept: instance.RescaleIntercept,
    };

    imageSet.setAttributes({
      niftiURL,
      loadImageIds: async () => {
        try {
          const loadedImageIds = await createNiftiImageIdsAndCacheMetadata({
            url: niftiURL,
            dicomMetadata,
          });

          imageSet.setAttributes({
            imageIds: loadedImageIds,
            numImageFrames: Array.isArray(loadedImageIds) ? loadedImageIds.length : 0,
            isReconstructable: true,
          });
        } catch (error) {
          console.error('Error loading niftiURL:', error);
        }
      },
    });
  }

  const imageIds = dataSource.getImageIdsForDisplaySet(imageSet);
  let imageId = imageIds[Math.floor(imageIds.length / 2)];
  let thumbnailInstance = instances[Math.floor(instances.length / 2)];
  if (isDynamicVolume) {
    const timePoints = dynamicVolumeInfo.timePoints;
    const middleIndex = Math.floor(timePoints.length / 2);
    const middleTimePointImageIds = timePoints[middleIndex];
    imageId = middleTimePointImageIds[Math.floor(middleTimePointImageIds.length / 2)];
  }

  imageSet.setAttributes({
    getThumbnailSrc: dataSource.retrieve.getGetThumbnailSrc?.(thumbnailInstance, imageId),
  });

  const { servicesManager } = appContext;
  const { customizationService } = servicesManager.services;

  imageSet.sort(customizationService);

  // Include the first image instance number (after sorted)
  /*imageSet.setAttribute(
    'instanceNumber',
    imageSet.getImage(0).InstanceNumber
  );*/

  /*const isReconstructable = isDisplaySetReconstructable(series, instances);

  imageSet.isReconstructable = isReconstructable.value;

  if (isReconstructable.missingFrames) {
    // TODO -> This is currently unused, but may be used for reconstructing
    // Volumes with gaps later on.
    imageSet.missingFrames = isReconstructable.missingFrames;
  }*/

  return imageSet;
};

const isSingleImageModality = modality => {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create
 *   a displaySet with a stack of images
 *
 * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
 * @returns {Array} The list of display sets created for the given series object
 */
function getDisplaySetsFromSeries(instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const displaySets = [];
  const sopClassUids = getSopClassUids(instances);

  // Search through the instances (InstanceMetadata object) of this series
  // Split Multi-frame instances and Single-image modalities
  // into their own specific display sets. Place the rest of each
  // series into another display set.
  const stackableInstances = [];
  instances.forEach((instance, instanceIndex) => {
    // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
    if (!isImage(instance.SOPClassUID) && !instance.Rows) {
      return;
    }

    let displaySet;
    if (isMultiFrame(instance)) {
      displaySet = makeDisplaySet([instance], instanceIndex);
      displaySet.setAttributes({
        sopClassUids,
        numImageFrames: instance.NumberOfFrames,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else if (isSingleImageModality(instance.Modality)) {
      displaySet = makeDisplaySet([instance], instanceIndex);
      displaySet.setAttributes({
        sopClassUids,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else {
      stackableInstances.push(instance);
    }
  });

  if (stackableInstances.length) {
    const displaySet = makeDisplaySet(stackableInstances, displaySets.length);
    displaySet.setAttribute('studyInstanceUid', instances[0].StudyInstanceUID);
    displaySet.setAttributes({
      sopClassUids,
    });
    displaySets.push(displaySet);
  }

  return displaySets;
}

const sopClassUids = [
  sopClassDictionary.ComputedRadiographyImageStorage,
  sopClassDictionary.DigitalXRayImageStorageForPresentation,
  sopClassDictionary.DigitalXRayImageStorageForProcessing,
  sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation,
  sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing,
  sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation,
  sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing,
  sopClassDictionary.CTImageStorage,
  sopClassDictionary.EnhancedCTImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedCTImageStorage,
  sopClassDictionary.UltrasoundMultiframeImageStorage,
  sopClassDictionary.MRImageStorage,
  sopClassDictionary.EnhancedMRImageStorage,
  sopClassDictionary.EnhancedMRColorImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedMRImageStorage,
  sopClassDictionary.UltrasoundImageStorage,
  sopClassDictionary.UltrasoundImageStorageRET,
  sopClassDictionary.SecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage,
  sopClassDictionary.XRayAngiographicImageStorage,
  sopClassDictionary.EnhancedXAImageStorage,
  sopClassDictionary.XRayRadiofluoroscopicImageStorage,
  sopClassDictionary.EnhancedXRFImageStorage,
  sopClassDictionary.XRay3DAngiographicImageStorage,
  sopClassDictionary.XRay3DCraniofacialImageStorage,
  sopClassDictionary.BreastTomosynthesisImageStorage,
  sopClassDictionary.CornealTopographyMapStorage,
  sopClassDictionary.BreastProjectionXRayImageStorageForPresentation,
  sopClassDictionary.BreastProjectionXRayImageStorageForProcessing,
  sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation,
  sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing,
  sopClassDictionary.NuclearMedicineImageStorage,
  sopClassDictionary.VLEndoscopicImageStorage,
  sopClassDictionary.VideoEndoscopicImageStorage,
  sopClassDictionary.VLMicroscopicImageStorage,
  sopClassDictionary.VideoMicroscopicImageStorage,
  sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage,
  sopClassDictionary.VLPhotographicImageStorage,
  sopClassDictionary.VideoPhotographicImageStorage,
  sopClassDictionary.OphthalmicPhotography8BitImageStorage,
  sopClassDictionary.OphthalmicPhotography16BitImageStorage,
  sopClassDictionary.OphthalmicTomographyImageStorage,
  // Handled by another sop class module
  // sopClassDictionary.VLWholeSlideMicroscopyImageStorage,
  sopClassDictionary.PositronEmissionTomographyImageStorage,
  sopClassDictionary.EnhancedPETImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedPETImageStorage,
  sopClassDictionary.RTImageStorage,
  sopClassDictionary.EnhancedUSVolumeStorage,
  sopClassDictionary.RTDoseStorage,
];

function getSopClassHandlerModule(appContextParam) {
  appContext = appContextParam;

  return [
    {
      name: sopClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
    {
      name: 'not-supported-display-sets-handler',
      sopClassUids: [],
      getDisplaySetsFromSeries: getDisplaySetsFromUnsupportedSeries,
    },
    {
      name: chartHandler.name,
      sopClassUids: chartHandler.sopClassUids,
      getDisplaySetsFromSeries: chartHandler.getDisplaySetsFromSeries,
    },
  ];
}

export default getSopClassHandlerModule;
