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

function makeSeriesInfo(instances, splitRules) {
  const NumberOfSeriesRelatedInstances = instances.length; //the #images in the series
  let numberOfFrames = 0;
  let numberOfNonImageObjects = 0;
  let numberOfSOPInstanceUIDsPerSeries = 0;

  for (const instance of instances) {
    if (instance.NumberOfFrames) {
      numberOfFrames += Number(instance.NumberOfFrames);
    } else if (instance.Rows) {
      //instance is img if it has instance.Rows
      numberOfFrames += 1;
    } else {
      numberOfNonImageObjects += 1;
    }

    if (instance.SOPInstanceUID) {
      numberOfSOPInstanceUIDsPerSeries += 1;
    }
  }
  const seriesInfo = {
    NumberOfSeriesRelatedInstances,
    numberOfFrames,
    numImageFrames: numberOfFrames,
    numberOfNonImageObjects,
    numberOfSOPInstanceUIDsPerSeries,
  };
  for (const splitRule of splitRules) {
    if (splitRule.makeSeriesInfo) {
      splitRule.makeSeriesInfo(instances, seriesInfo);
    }
  }

  return seriesInfo;
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
    console.warn('getDisplaySetInfo', instances);
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

function makeDisplaySet(instances, options) {
  const { extensionManager } = appContext;
  const dataSource = extensionManager.getActiveDataSource()[0];

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

  const multiFrame = isMultiFrame(instance);

  const thumbnailInstance = instances[Math.floor(instances.length / 2)];

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
    isMultiFrame: multiFrame,
    countIcon: isReconstructable ? 'icon-mpr' : undefined,
    numImageFrames: multiFrame ? instance.NumberOfFrames : instance.length,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${sopClassHandlerName}`,
    isReconstructable,
    messages,
    averageSpacingBetweenFrames: averageSpacingBetweenFrames || null,
    isDynamicVolume,
    dynamicVolumeInfo,
    getThumbnailSrc: dataSource.retrieve.getGetThumbnailSrc?.(
      thumbnailInstance,
      thumbnailInstance.imageId
    ),
  });

  // Sort the images in this series if needed
  const shallSort = true;
  if (shallSort && imageSet?.images?.length > 1) {
    const images = imageSet.images;

    const allSameInstanceNumber = images.every(
      img => img.InstanceNumber === images[0].InstanceNumber
    );

    images.sort((a, b) => {
      if (!allSameInstanceNumber) {
        // Sort by InstanceNumber if it's usable
        const instA = parseInt(a.InstanceNumber) || 0;
        const instB = parseInt(b.InstanceNumber) || 0;
        if (instA != instB) {
          return instA - instB;
        }
      }

      // Fallback: sort by InstanceCreationTime (lexical sort is safe for HHMMSS)
      const timeA = a.InstanceCreationTime || '';
      const timeB = b.InstanceCreationTime || '';

      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }

      // return stringCompare(a.SOPInstanceUID, b.SOPInstanceUID); //BUG: stringCompare doesn't exist
    });
  }

  return imageSet;
}

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create a displaySet with a stack of images
 *
 * @param {string} key The key used to retrieve split rules from the customization service
 * @param {Object} appContextParam The application context object containing the services manager
 * @param {Array} instances An array of instances representing the series metadata
 * @returns {Array} The list of display sets created for the given series object
 */

export default function getDisplaySetsFromSeries(key, appContextParam, instances) {
  appContext = appContextParam;
  const { servicesManager } = appContext;
  const { customizationService } = servicesManager.services;

  const splitRules = customizationService.getCustomization(key);

  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const displaySets = [];
  const instancesMap = new Map();
  const sopClassUids = getSopClassUids(instances);

  const seriesInfo = makeSeriesInfo(instances, splitRules);

  instances.forEach(instance => {
    let addedToDisplaySet = false;

    // Iterate through each split rule to categorize the instance
    splitRules.forEach(splitRule => {
      if (
        !addedToDisplaySet &&
        (!splitRule || !splitRule.ruleSelector || splitRule.ruleSelector(instance, seriesInfo))
      ) {
        addedToDisplaySet = true;
        // Generate a key by concatenating the results of the splitKey functions
        const key = (splitRule.splitKey || ['SeriesInstanceUID'])
          .map(spk => (typeof spk === 'function' ? spk(instance, seriesInfo) : instance[spk]))
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
  if (instancesMap.size > 1) {
    console.warn('************* Series split into', instancesMap.size);
  }
  for (const value of instancesMap.values()) {
    // Create a display set from unique instances
    const displaySet = makeDisplaySet(value.instances);
    console.warn(
      'Split rule',
      value.splitRule.id || value.splitRule,
      value.instances.length,
      displaySet.SeriesNumber,
      displaySet.SeriesDescription,
      displaySet
    );

    const options = {
      instances: value.instances,
      splitNumber: index,
    };

    const instance = value.instances[0];

    const attributes = {
      ...seriesInfo,
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
