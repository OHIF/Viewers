/**
 *  Should Find the requested instance metadata into the displaySets and return
 *
 * @param {Array} displaySets - List of displaySets
 * @param {string} sopInstanceUid - sopInstanceUID to look for
 * @returns {Object} - instance metadata found
 */
const findInstanceMetadataBySopInstanceUid = (displaySets, sopInstanceUid) => {
  let instanceFound;

  displaySets.find(displaySet => {
    if (!displaySet.images) return false;

    instanceFound = displaySet.images.find(
      instanceMetadata => instanceMetadata._sopInstanceUID === sopInstanceUid
    );

    return !!instanceFound;
  });

  return instanceFound;
};

export default findInstanceMetadataBySopInstanceUid;
