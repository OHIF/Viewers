import { utils, classes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { metaData } from '@cornerstonejs/core';
import { id } from '../id';
import getDisplaySetMessages from '../getDisplaySetMessages';

const { sortStudyInstances, isDisplaySetReconstructable } = utils;
const { ImageSet } = classes;

const DEFAULT_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';

export const STACK_SOP_CLASS_HANDLER_ID = `${id}.sopClassHandlerModule.stack`;

/**
 * The application context required to build an ImageSet display set.  This is
 * the same shape as the `appContext` handed to `getSopClassHandlerModule`.
 */
export type ImageSetFactoryContext = {
  servicesManager: AppTypes.ServicesManager;
  extensionManager: AppTypes.ExtensionManager;
  appConfig?: AppTypes.Config;
};

const isMultiFrame = instance => {
  return instance.NumberOfFrames > 1;
};

function getDynamicVolumeInfo(imageIds, context: ImageSetFactoryContext) {
  const { extensionManager } = context;

  if (!extensionManager) {
    throw new Error('extensionManager is not available');
  }

  const volumeLoaderUtility = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.volumeLoader'
  );
  const { getDynamicVolumeInfo: csGetDynamicVolumeInfo } = volumeLoaderUtility.exports;

  return csGetDynamicVolumeInfo(imageIds);
}

/**
 * Computes reconstructability / dynamic-volume information for a set of
 * instances.  Exported so incremental updates (`updateInstances`) can re-run
 * the exact computation used at creation time.
 */
export function getDisplaySetInfo(instances, imageIds, context: ImageSetFactoryContext) {
  const dynamicVolumeInfo = getDynamicVolumeInfo(imageIds, context);
  const { isDynamicVolume, timePoints } = dynamicVolumeInfo;
  let displaySetInfo;

  const { appConfig } = context;

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

/**
 * Builds a stack/volume ImageSet display set carrying the full OHIF attribute
 * set (`label`, `supportsWindowLevel`, `FrameOfReferenceUID`,
 * `SOPClassHandlerId`, `isReconstructable`, `messages`, ...).
 *
 * This is the single shared factory used by both the legacy stack SOP class
 * handler and the `useMetadataDisplaySet` split-rules path, so both paths
 * produce identical display sets.
 */
export function makeImageSetDisplaySet(instances, context: ImageSetFactoryContext) {
  // Need to sort the instances in order to get a consistent instance/thumbnail
  sortStudyInstances(instances);
  const instance = instances[0];
  const imageSet = new ImageSet(instances);
  const { extensionManager } = context;
  const dataSource = extensionManager.getActiveDataSource()[0];
  const imageIds = dataSource.getImageIdsForDisplaySet(imageSet);
  const {
    isDynamicVolume,
    value: isReconstructable,
    averageSpacingBetweenFrames,
    dynamicVolumeInfo,
  } = getDisplaySetInfo(instances, imageIds, context);

  const volumeLoaderSchema = isDynamicVolume
    ? DYNAMIC_VOLUME_LOADER_SCHEME
    : DEFAULT_VOLUME_LOADER_SCHEME;

  // set appropriate attributes to image set...
  const messages = getDisplaySetMessages(instances, isReconstructable, isDynamicVolume);

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
    SOPClassHandlerId: STACK_SOP_CLASS_HANDLER_ID,
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

  let imageId = imageIds[Math.floor(imageIds.length / 2)];
  const thumbnailInstance = instances[Math.floor(instances.length / 2)];
  if (isDynamicVolume) {
    const timePoints = dynamicVolumeInfo.timePoints;
    const middleIndex = Math.floor(timePoints.length / 2);
    const middleTimePointImageIds = timePoints[middleIndex];
    imageId = middleTimePointImageIds[Math.floor(middleTimePointImageIds.length / 2)];
  }

  imageSet.setAttributes({
    getThumbnailSrc: dataSource.retrieve.getGetThumbnailSrc?.(thumbnailInstance, imageId),
  });

  const { servicesManager } = context;
  const { customizationService } = servicesManager.services;

  imageSet.sort(customizationService);

  return imageSet;
}
