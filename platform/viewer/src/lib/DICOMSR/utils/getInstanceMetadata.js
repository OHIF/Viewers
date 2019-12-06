/**
 *  Should look for the instance metadata into the displaySets and return it
 *
 * @param {Array} displaySets List of displaySets
 * @param {String} sopInstanceUid sopInstanceUID to look for
 * @returns {Object} instance metadata searched
 */
const getInstanceMetadata = (displaySets, sopInstanceUid) => {
  let instanceFound;

  displaySets.find(displaySet => {
    if (!displaySet.images) return false;

    instanceFound = displaySet.images.find(instanceMetadata => instanceMetadata._sopInstanceUID === sopInstanceUid);

    return !!instanceFound;
  });

  return instanceFound;
};

export default getInstanceMetadata;
