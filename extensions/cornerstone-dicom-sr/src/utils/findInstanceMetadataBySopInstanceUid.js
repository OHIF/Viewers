/**
 *  Should Find the requested instance metadata into the displaySets and return
 *
 * @param {Array} displaySets - List of displaySets
 * @param {string} SOPInstanceUID - sopInstanceUID to look for
 * @returns {Object} - instance metadata found
 */
const findInstanceMetadataBySopInstanceUID = (displaySets, SOPInstanceUID) => {
  let instanceFound;

  displaySets.find(displaySet => {
    if (!displaySet.images) return false;

    instanceFound = displaySet.images.find(
      instanceMetadata =>
        instanceMetadata.getSOPInstanceUID() === SOPInstanceUID
    );

    return !!instanceFound;
  });

  return instanceFound;
};

export default findInstanceMetadataBySopInstanceUID;
