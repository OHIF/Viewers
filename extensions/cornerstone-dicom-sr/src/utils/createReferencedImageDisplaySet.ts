import { DisplaySetService, classes } from '@ohif/core';

const ImageSet = classes.ImageSet;

const findInstance = (measurement, displaySetService: DisplaySetService) => {
  const { displaySetInstanceUID, ReferencedSOPInstanceUID: sopUid } = measurement;
  const referencedDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  if (!referencedDisplaySet.images) {
    return;
  }
  return referencedDisplaySet.images.find(it => it.SOPInstanceUID === sopUid);
};

/** Finds references to display sets inside the measurements
 * contained within the provided display set.
 * @return an array of instances referenced.
 */
const findReferencedInstances = (displaySetService: DisplaySetService, displaySet) => {
  const instances = [];
  const instanceById = {};
  for (const measurement of displaySet.measurements) {
    const { imageId } = measurement;
    if (!imageId) {
      continue;
    }
    if (instanceById[imageId]) {
      continue;
    }

    const instance = findInstance(measurement, displaySetService);
    if (!instance) {
      console.log('Measurement', measurement, 'had no instances found');
      continue;
    }

    instanceById[imageId] = instance;
    instances.push(instance);
  }
  return instances;
};

/**
 * Creates a new display set containing a single image instance for each
 * referenced image.
 *
 * @param displaySetService
 * @param displaySet - containing measurements referencing images.
 * @returns A new (registered/active) display set containing the referenced images
 */
const createReferencedImageDisplaySet = (displaySetService, displaySet) => {
  const instances = findReferencedInstances(displaySetService, displaySet);
  // This will be a  member function of the created image set
  const updateInstances = function () {
    this.images.splice(
      0,
      this.images.length,
      ...findReferencedInstances(displaySetService, displaySet)
    );
    this.numImageFrames = this.images.length;
  };

  const imageSet = new ImageSet(instances);
  const instance = instances[0];
  imageSet.setAttributes({
    displaySetInstanceUID: imageSet.uid, // create a local alias for the imageSet UID
    SeriesDate: instance.SeriesDate,
    SeriesTime: instance.SeriesTime,
    SeriesInstanceUID: imageSet.uid,
    StudyInstanceUID: instance.StudyInstanceUID,
    SeriesNumber: instance.SeriesNumber || 0,
    SOPClassUID: instance.SOPClassUID,
    SeriesDescription: `${displaySet.SeriesDescription} KO ${displaySet.instance.SeriesNumber}`,
    Modality: 'KO',
    isMultiFrame: false,
    numImageFrames: instances.length,
    SOPClassHandlerId: `@ohif/extension-default.sopClassHandlerModule.stack`,
    isReconstructable: false,
    // This object is made of multiple instances from other series
    isCompositeStack: true,
    madeInClient: true,
    excludeFromThumbnailBrowser: true,
    updateInstances,
  });

  displaySetService.addDisplaySets(imageSet);

  return imageSet;
};

export default createReferencedImageDisplaySet;
