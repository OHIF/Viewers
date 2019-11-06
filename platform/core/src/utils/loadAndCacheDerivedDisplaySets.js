import studyMetadataManager from './studyMetadataManager';

export default function(referencedDisplaySet, studies) {
  const { studyInstanceUid, seriesInstanceUid } = referencedDisplaySet;

  const studyMetadata = studyMetadataManager.get(studyInstanceUid);

  const numDisplaySets =
    studyMetadata._displaySets.length +
    studyMetadata._derivedDisplaySets.length;

  debugger;

  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  console.log(`hasNext: ${study.seriesLoader.hasNext()}`);

  if (study.seriesLoader.hasNext()) {
    // wait for all metadata to load first.
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

    debugger;

    recentDisplaySet.load(referencedDisplaySet, studies);
  });
}
