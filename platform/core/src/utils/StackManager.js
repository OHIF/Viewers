let stackMap = {};
let configuration = {};
const stackUpdatedCallbacks = [];

/**
 * Loop through the current series and add metadata to the
 * Cornerstone meta data provider. This will be used to fill information
 * into the viewport overlays, and to calculate reference lines and orientation markers
 * @param  {Object} stackMap              stackMap object
 * @param  {Object} displaySet            The set of images to make the stack from
 * @return {Array}                        Array with image IDs
 */
function createAndAddStack(
  stackMap,
  displaySet,
  dataSource,
  stackUpdatedCallbacks
) {
  const {
    images,
    displaySetInstanceUID,
    StudyInstanceUID,
    frameRate,
    isClip,
  } = displaySet;
  if (!images) {
    return;
  }

  const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);

  const stack = {
    StudyInstanceUID,
    displaySetInstanceUID,
    imageIds,
    frameRate,
    isClip,
  };

  stackMap[displaySetInstanceUID] = stack;

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
   * @param displaySet The set of images to make the stack from
   * @return {Array} Array with image IDs
   */
  makeAndAddStack(displaySet, dataSource) {
    return configuration.createAndAddStack(
      stackMap,
      displaySet,
      dataSource,
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
   * @param displaySet The set of images to make the stack from
   * @return {Array} Array with image IDs
   */
  findOrCreateStack(displaySet, dataSource) {
    let stack = this.findStack(displaySet.displaySetInstanceUID);

    if (!stack || !stack.imageIds) {
      stack = this.makeAndAddStack(displaySet, dataSource);
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
      throw new Error('callback must be provided as a function');
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
