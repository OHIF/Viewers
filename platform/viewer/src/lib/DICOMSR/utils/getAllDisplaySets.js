/**
 *
 * Retrieve a list of all displaySets of all studies
 *
 * @param {object} studies - List of studies loaded into the viewer
 * @returns {object} List of DisplaySets
 */
const getAllDisplaySets = (studies) => {
  let allDisplaySets = [];

  studies.forEach(study => {
    if (study.getDisplaySets) {
      allDisplaySets = allDisplaySets.concat(study.getDisplaySets());
    }
  });

  return allDisplaySets;
};

export default getAllDisplaySets;
