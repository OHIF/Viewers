/**
 * Removes the first instance of an element from an array, if an equal value exists
 *
 * @param array
 * @param input
 *
 * @returns {boolean} Whether or not the element was found and removed
 */
const removeFromArray = (array, input) => {
  // If the array is empty, stop here
  if (!array || !array.length) {
    return false;
  }

  array.forEach((value, index) => {
    // TODO: Double check whether or not this deep equality check is necessary
    //if (_.isEqual(value, input)) {
    if (value === input) {
      indexToRemove = index;
      return false;
    }
  });

  if (indexToRemove === void 0) {
    return false;
  }

  array.splice(indexToRemove, 1);
  return true;
};

export { removeFromArray };
