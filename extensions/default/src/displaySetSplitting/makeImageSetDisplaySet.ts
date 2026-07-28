import { utils, classes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { metaData } from '@cornerstonejs/core';
import { id } from '../id';
import getDisplaySetMessages from '../getDisplaySetMessages';

const { sortStudyInstances, isDisplaySetReconstructable } = utils;
const { ImageSet } = classes;

const DEFAULT_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';

/**
 * The registered module name of the stack SOP class handler, and the resulting
 * fully-qualified `SOPClassHandlerId`.
 *
 * Both live here rather than in `getSopClassHandlerModule` because that module
 * imports this one (the reverse would be a cycle).  The handler imports the
 * name back for its registration so the id and the registration can never
 * disagree about what the handler is called.
 */
export const STACK_SOP_CLASS_HANDLER_NAME = 'stack';
export const STACK_SOP_CLASS_HANDLER_ID = `${id}.sopClassHandlerModule.${STACK_SOP_CLASS_HANDLER_NAME}`;

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

  if (!volumeLoaderUtility?.exports) {
    throw new Error('The @ohif/extension-cornerstone volumeLoader utility module is not available');
  }

  const { getDynamicVolumeInfo: csGetDynamicVolumeInfo } = volumeLoaderUtility.exports;

  return csGetDynamicVolumeInfo(imageIds);
}

/**
 * Computes reconstructability / dynamic-volume information for a set of
 * instances.  Callers go through {@link applyImageListAttributes} so creation
 * and incremental updates share one computation.
 */
function getDisplaySetInfo(instances, imageIds, context: ImageSetFactoryContext) {
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

  // Series-level identity: fixed for the lifetime of the display set, because
  // adding more instances of the SAME series cannot change any of it.
  imageSet.setAttributes({
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
    SOPClassHandlerId: STACK_SOP_CLASS_HANDLER_ID,
    supportsWindowLevel: true,
    label:
      instance.SeriesDescription ||
      `${i18n.t('Series')} ${instance.SeriesNumber} - ${i18n.t(instance.Modality)}`,
    FrameOfReferenceUID: instance.FrameOfReferenceUID,
  });

  // Everything derived from the image list. `imageSet.sort` reads
  // `isReconstructable`, so this must run before it.
  const derived = applyImageListAttributes(imageSet, context);
  applyThumbnailSrc(imageSet, context, derived);

  const { servicesManager } = context;
  const { customizationService } = servicesManager.services;

  imageSet.sort(customizationService);

  return imageSet;
}

/**
 * Applies every attribute derived from an ImageSet's current image list.
 *
 * Shared by the initial build and the split-rule `updateInstances` merge hook
 * so the two cannot drift: whatever is recomputed here is, by construction,
 * recomputed identically when instances arrive later.
 *
 * Series-level identity (`label`, `SeriesDescription`, `Modality`, ...) is
 * deliberately NOT touched — it cannot change by adding instances to the same
 * series, and a split rule's `customAttributes` may have overridden it (e.g.
 * the SCOUT example relabels `SeriesDescription`).
 *
 * @returns the intermediate values a caller needs for the thumbnail.
 */
export function applyImageListAttributes(imageSet, context: ImageSetFactoryContext) {
  const dataSource = context.extensionManager.getActiveDataSource()[0];
  const imageIds = dataSource.getImageIdsForDisplaySet(imageSet);
  const {
    isDynamicVolume,
    value: isReconstructable,
    averageSpacingBetweenFrames,
    dynamicVolumeInfo,
  } = getDisplaySetInfo(imageSet.images, imageIds, context);

  // `ImageSet` snapshots `instance = images[0]` in its constructor and `sort()`
  // does not refresh it, so an instance that sorts to the front would otherwise
  // leave `instance` pointing at the wrong image.
  const instance = imageSet.images[0];
  const multiFrame = isMultiFrame(instance);

  imageSet.setAttributes({
    instance,
    isMultiFrame: multiFrame,
    volumeLoaderSchema: isDynamicVolume
      ? DYNAMIC_VOLUME_LOADER_SCHEME
      : DEFAULT_VOLUME_LOADER_SCHEME,
    // A multiframe display set holds one instance whose frames are the content;
    // a stack counts images.
    numImageFrames: multiFrame ? Number(instance.NumberOfFrames) : imageSet.images.length,
    countIcon: isReconstructable ? 'icon-mpr' : undefined,
    isReconstructable,
    messages: getDisplaySetMessages(imageSet.images, isReconstructable, isDynamicVolume),
    averageSpacingBetweenFrames: averageSpacingBetweenFrames || null,
    isDynamicVolume,
    dynamicVolumeInfo,
  });

  return { imageIds, isDynamicVolume, dynamicVolumeInfo };
}

/** Picks the middle image (middle time point when dynamic) as the thumbnail. */
export function applyThumbnailSrc(
  imageSet,
  context: ImageSetFactoryContext,
  { imageIds, isDynamicVolume, dynamicVolumeInfo }
) {
  const dataSource = context.extensionManager.getActiveDataSource()[0];
  let imageId = imageIds[Math.floor(imageIds.length / 2)];
  const thumbnailInstance = imageSet.images[Math.floor(imageSet.images.length / 2)];
  if (isDynamicVolume) {
    const timePoints = dynamicVolumeInfo.timePoints;
    const middleIndex = Math.floor(timePoints.length / 2);
    const middleTimePointImageIds = timePoints[middleIndex];
    imageId = middleTimePointImageIds[Math.floor(middleTimePointImageIds.length / 2)];
  }

  imageSet.setAttributes({
    getThumbnailSrc: dataSource.retrieve.getGetThumbnailSrc?.(thumbnailInstance, imageId),
  });
}
