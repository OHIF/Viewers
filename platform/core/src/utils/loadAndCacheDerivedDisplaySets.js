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
 * @param {Study[]} studies Collection of studies
 * @param {object} logger
 * @param {object} snackbar
 * @returns void
 */
async function loadAndCacheDerivedDisplaySets(referencedDisplaySet, studies, logger, snackbar) {
  const { StudyInstanceUID, SeriesInstanceUID } = referencedDisplaySet;
  const promises = [];
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);

  if (!studyMetadata) {
    return promises;
  }

  const derivedDisplaySets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: SeriesInstanceUID,
  });

  if (!derivedDisplaySets.length) {
    return promises;
  }

  // Filter by type
  const displaySetsPerModality = {};

  derivedDisplaySets.forEach(displaySet => {
    const Modality = displaySet.Modality;

    if (displaySetsPerModality[Modality] === undefined) {
      displaySetsPerModality[Modality] = [];
    }

    displaySetsPerModality[Modality].push(displaySet);
  });

  // For each type, see if any are loaded, if not load the most recent.
  await Promise.all(Object.keys(displaySetsPerModality).map(async (key) => {
    const displaySets = displaySetsPerModality[key];

    const isLoaded = displaySets.some(displaySet => displaySet.isLoaded);
    if (isLoaded) {
      return;
    }

    if (displaySets.some(displaySet => displaySet.loadError)) {
      return;
    }

    // find most recent and load it.
    let recentDateTime = 0;
    let recentDisplaySet = displaySets[0];

    displaySets.forEach(displaySet => {
      const dateTime = Number(
        `${displaySet.SeriesDate}${displaySet.SeriesTime}`
      );
      if (dateTime > recentDateTime) {
        recentDateTime = dateTime;
        recentDisplaySet = displaySet;
      }
    });

    try {
      await recentDisplaySet.load(referencedDisplaySet, studies);
    } catch (error) {
      recentDisplaySet.isLoaded = false;
      recentDisplaySet.loadError = true;
      logger.error({ error, message: error.message });
      snackbar.show({
        title: 'Error loading derived display set:',
        message: error.message,
        type: 'error',
        error,
        autoClose: false,
      });
    }
  }));

  /*
  * TODO: Improve the way we notify parts of the app
  * that depends on derived display sets to be loaded.
  * (Implement pubsub for better tracking of derived display sets)
  */
  const event = new CustomEvent('deriveddisplaysetsloadedandcached');
  document.dispatchEvent(event);
};

export default loadAndCacheDerivedDisplaySets;
