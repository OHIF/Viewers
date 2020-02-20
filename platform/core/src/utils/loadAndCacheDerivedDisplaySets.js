import studyMetadataManager from './studyMetadataManager';

/**
 * Study schema
 *
 * @typedef {Object} Study
 * @property {Array} seriesList -
 * @property {Object} seriesMap -
 * @property {Object} seriesLoader -
 * @property {string} wadoUriRoot -
 * @property {string} wadoRoot -
 * @property {string} qidoRoot -
 * @property {string} patientName -
 * @property {string} patientId -
 * @property {number} patientAge -
 * @property {number} patientSize -
 * @property {number} patientWeight -
 * @property {string} accessionNumber -
 * @property {string} studyDate -
 * @property {string} studyTime -
 * @property {string} modalities -
 * @property {string} studyDescription -
 * @property {string} imageCount -
 * @property {string} studyInstanceUid -
 * @property {string} institutionName -
 * @property {Array} displaySets -
 */

/**
 * Factory function to load and cache derived display sets.
 *
 * @param {object} referencedDisplaySet Display set
 * @param {string} referencedDisplaySet.displaySetInstanceUid Display set instance uid
 * @param {string} referencedDisplaySet.seriesDate
 * @param {string} referencedDisplaySet.seriesTime
 * @param {string} referencedDisplaySet.seriesInstanceUid
 * @param {string} referencedDisplaySet.seriesNumber
 * @param {string} referencedDisplaySet.seriesDescription
 * @param {number} referencedDisplaySet.numImageFrames
 * @param {string} referencedDisplaySet.frameRate
 * @param {string} referencedDisplaySet.modality
 * @param {boolean} referencedDisplaySet.isMultiFrame
 * @param {number} referencedDisplaySet.instanceNumber
 * @param {boolean} referencedDisplaySet.isReconstructable
 * @param {string} referencedDisplaySet.studyInstanceUid
 * @param {Array} referencedDisplaySet.sopClassUids
 * @param {string} referencedDisplaySet.plugin
 * @param {Study[]} studies Collection of studies
 * @returns void
 */
const loadAndCacheDerivedDisplaySets = (referencedDisplaySet, studies) => {
  const { studyInstanceUid, seriesInstanceUid } = referencedDisplaySet;

  const studyMetadata = studyMetadataManager.get(studyInstanceUid);

  if (!studyMetadata) {
    return;
  }

  const derivedDisplaySets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: seriesInstanceUid,
  });

  if (!derivedDisplaySets.length) {
    return;
  }

  // Filter by type
  const displaySetsPerPlugin = {};

  derivedDisplaySets.forEach(displaySet => {
    const plugin = displaySet.plugin;

    if (displaySetsPerPlugin[plugin] === undefined) {
      displaySetsPerPlugin[plugin] = [];
    }

    displaySetsPerPlugin[plugin].push(displaySet);
  });

  // For each type, see if any are loaded, if not load the most recent.
  Object.keys(displaySetsPerPlugin).forEach(key => {
    const displaySets = displaySetsPerPlugin[key];
    const isLoaded = displaySets.some(displaySet => displaySet.isLoaded);

    if (isLoaded) {
      return;
    }

    // find most recent and load it.
    let recentDateTime = 0;
    let recentDisplaySet;

    displaySets.forEach(displaySet => {
      const dateTime = Number(
        `${displaySet.seriesDate}${displaySet.seriesTime}`
      );
      if (dateTime > recentDateTime) {
        recentDateTime = dateTime;
        recentDisplaySet = displaySet;
      }
    });

    recentDisplaySet.load(referencedDisplaySet, studies);
  });
};

export default loadAndCacheDerivedDisplaySets;
