import { classes, utils } from '@ohif/core';

import { id } from '../id';
import getDisplaySetMessages from '../getDisplaySetMessages';

const { ImageSet } = classes;
const { isDisplaySetReconstructable } = utils;
const DEFAULT_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';
const sopClassHandlerName = 'stack';

let appContext = {};

const isMultiFrame = instance => instance.NumberOfFrames > 1;

function getDynamicVolumeInfo(instances) {
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
}

function getDisplaySetInfo(instances) {
  const dynamicVolumeInfo = getDynamicVolumeInfo(instances);
  const { isDynamicVolume, timePoints } = dynamicVolumeInfo;
  let displaySetInfo;

  const { appConfig } = appContext;

  if (isDynamicVolume) {
    const timePoint = timePoints[0];
    const instancesMap = new Map();

    // O(n) to convert it into a map and O(1) to find each instance
    instances.forEach(instance => instancesMap.set(instance.imageId, instance));

    const firstTimePointInstances = timePoint.map(imageId => instancesMap.get(imageId));

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

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();

  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });

  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

function makeDisplaySet(instances) {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);

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
  });

  // Sort the images in this series if needed
  const shallSort = true; //!OHIF.utils.ObjectPath.get(Meteor, 'settings.public.ui.sortSeriesByIncomingOrder');
  if (shallSort) {
    imageSet.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      return (parseInt(a.InstanceNumber) || 0) - (parseInt(b.InstanceNumber) || 0);
    });
  }

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
}

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create a displaySet with a stack of images
 *
 * @param {string} key The key used to retrieve split rules from the customization service
 * @param {Array} defaultRules The default rules to be used if no custom rules are provided
 * @param {Object} appContextParam The application context object containing the services manager
 * @param {Array} instances An array of instances representing the series metadata
 * @returns {Array} The list of display sets created for the given series object
 */
export default function getDisplaySetsFromSeries(key, defaultRules, appContextParam, instances) {
  appContext = appContextParam;
  const { servicesManager } = appContext;
  const { customizationService } = servicesManager.services;

  const splitRules = customizationService.getCustomization(key) ?? defaultRules;

  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const displaySets = [];
  const instancesMap = new Map();
  const sopClassUids = getSopClassUids(instances);

  instances.forEach(instance => {
    let addedToDisplaySet = false;

    // Iterate through each split rule to categorize the instance
    splitRules.forEach(splitRule => {
      if (
        !addedToDisplaySet &&
        (!splitRule || !splitRule.ruleSelector || splitRule.ruleSelector(instance))
      ) {
        addedToDisplaySet = true;
        // Generate a key by concatenating the results of the splitKey functions
        const key = (splitRule.splitKey || ['SeriesInstanceUID'])
          .map(spk => (typeof spk === 'function' ? spk(instance) : instance[spk]))
          .join('&');

        // Ensure the key exists in the instancesMap
        if (!instancesMap.has(key)) {
          const instanceMapObj = { instances: [], splitRule };
          instancesMap.set(key, instanceMapObj);
        }

        // Add the instance to the corresponding key's list
        const instanceMap = instancesMap.get(key);
        instanceMap.instances.push(instance);
      }
    });
  });

  // Iterate through each instances to add the groups to displaySets
  let index = 0;
  for (const value of instancesMap.values()) {
    // Create a display set from unique instances
    const displaySet = makeDisplaySet(value.instances);

    const options = {
      instances: value.instances,
      splitNumber: index,
    };

    const instance = value.instances[0];

    const attributes = {
      sopClassUids,
      instance,
      acquisitionDatetime: instance.AcquisitionDateTime,
      instanceNumber: instance.InstanceNumber,
      studyInstanceUid: instance.StudyInstanceUID,
    };

    // Gather attributes, including custom attributes if provided
    const customAttributes = value.splitRule.customAttributes?.(attributes, options);
    Object.assign(attributes, customAttributes);

    // Apply gathered attributes to the display set
    displaySet.setAttributes(attributes);

    // Add the display set to the list
    displaySets.push(displaySet);

    index++;
  }

  return displaySets;
}
