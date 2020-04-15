import OHIFError from '../classes/OHIFError.js';
import getImageId from './getImageId';
import metadataProvider from '../classes/MetadataProvider.js';

let stackMap = {};
let configuration = {};
const stackUpdatedCallbacks = [];

/**
 * Loop through the current series and add metadata to the
 * Cornerstone meta data provider. This will be used to fill information
 * into the viewport overlays, and to calculate reference lines and orientation markers
 * @param  {Object} stackMap              stackMap object
 * @param  {Object} study                 Study object
 * @param  {Object} displaySet            The set of images to make the stack from
 * @return {Array}                        Array with image IDs
 */
function createAndAddStack(stackMap, study, displaySet, stackUpdatedCallbacks) {
  const images = displaySet.images;
  if (!images) {
    return;
  }

  const numImages = images.length;
  const imageIds = [];
  let imageId;

  displaySet.images.forEach((instance, imageIndex) => {
    const image = instance.getData();
    const metaData = {
      instance: image, // in this context, instance will be the data of the InstanceMetadata object...
      series: displaySet, // TODO: Check this
      study,
      numImages,
      imageIndex: imageIndex + 1,
    };

    const naturalizedInstance = instance.getData().metadata;
    const NumberOfFrames = naturalizedInstance.NumberOfFrames;

    if (NumberOfFrames > 1) {
      for (let i = 0; i < NumberOfFrames; i++) {
        metaData.frameNumber = i;
        imageId = getImageId(image, i);
        imageIds.push(imageId);

        const {
          StudyInstanceUID,
          SeriesInstanceUID,
          SOPInstanceUID,
        } = instance.getData().metadata;

        metadataProvider.addImageIdToUIDs(imageId, {
          StudyInstanceUID,
          SeriesInstanceUID,
          SOPInstanceUID,
        });
      }
    } else {
      metaData.frameNumber = 1;
      imageId = getImageId(image);
      imageIds.push(imageId);

      const {
        StudyInstanceUID,
        SeriesInstanceUID,
        SOPInstanceUID,
      } = naturalizedInstance;

      metadataProvider.addImageIdToUIDs(imageId, {
        StudyInstanceUID,
        SeriesInstanceUID,
        SOPInstanceUID,
      });
    }
  });

  const stack = {
    StudyInstanceUID: study.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    imageIds,
    frameRate: displaySet.frameRate,
    isClip: displaySet.isClip,
  };

  stackMap[displaySet.displaySetInstanceUID] = stack;

  return stack;
}

configuration = {
  createAndAddStack,
};

/**
 * This object contains all the functions needed for interacting with the stack manager.
 * Generally, findStack is the only function used. If you want to know when new stacks
 * come in, you can register a callback with addStackUpdatedCallback.
 */
const StackManager = {
  /**
   * Removes all current stacks
   */
  clearStacks() {
    stackMap = {};
  },
  /**
   * Create a stack from an image set, as well as add in the metadata on a per image bases.
   * @param study The study who's metadata will be added
   * @param displaySet The set of images to make the stack from
   * @return {Array} Array with image IDs
   */
  makeAndAddStack(study, displaySet) {
    return configuration.createAndAddStack(
      stackMap,
      study,
      displaySet,
      stackUpdatedCallbacks
    );
  },
  /**
   * Find a stack from the currently created stacks.
   * @param displaySetInstanceUID The UID of the stack to find.
   * @returns {*} undefined if not found, otherwise the stack object is returned.
   */
  findStack(displaySetInstanceUID) {
    return stackMap[displaySetInstanceUID];
  },
  /**
   * Find a stack or reate one if it has not been created yet
   * @param study The study who's metadata will be added
   * @param displaySet The set of images to make the stack from
   * @return {Array} Array with image IDs
   */
  findOrCreateStack(study, displaySet) {
    let stack = this.findStack(displaySet.displaySetInstanceUID);

    if (!stack || !stack.imageIds) {
      stack = this.makeAndAddStack(study, displaySet);
    }

    return stack;
  },
  /**
   * Gets the underlying map of displaySetInstanceUID to stack object.
   * WARNING: Do not change this object. It directly affects the manager.
   * @returns {{}} map of displaySetInstanceUID -> stack.
   */
  getAllStacks() {
    return stackMap;
  },
  /**
   * Adds in a callback to be called on a stack being added / updated.
   * @param callback must accept at minimum one argument,
   * which is the stack that was added / updated.
   */
  addStackUpdatedCallback(callback) {
    if (typeof callback !== 'function') {
      throw new OHIFError('callback must be provided as a function');
    }
    stackUpdatedCallbacks.push(callback);
  },
  /**
   * Return configuration
   */
  getConfiguration() {
    return configuration;
  },
  /**
   * Set configuration, in order to provide compatibility
   * with other systems by overriding this functions
   * @param {Object} config object with functions to be overrided
   *
   * For now, only makeAndAddStack can be overrided
   */
  setConfiguration(config) {
    configuration = config;
  },
};

export { StackManager };
export default StackManager;
