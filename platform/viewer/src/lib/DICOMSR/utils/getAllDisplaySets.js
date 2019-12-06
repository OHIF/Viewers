/**
 * Retrieve a list of all displaySets of all studies
 *
 * @param {Object} studyMetadataManager
 * @returns {Object} List of DisplaySets
 */
const getAllDisplaySets = (studyMetadataManager) => {
  const allStudies = studyMetadataManager.all();
  let allDisplaySets = [];

  allStudies.forEach(study => {
    if (study.getDisplaySets) {
      allDisplaySets = allDisplaySets.concat(study.getDisplaySets());
    }
  });

  return allDisplaySets;
};

export default getAllDisplaySets;
