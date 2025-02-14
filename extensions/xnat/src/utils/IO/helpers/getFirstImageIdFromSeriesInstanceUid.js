import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const getFirstImageIdFromSeriesInstanceUid = seriesInstanceUid => {
  const studies = studyMetadataManager.all();
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      const displaySet = displaySets[j];

      if (displaySet.SeriesInstanceUID === seriesInstanceUid) {
        return displaySet.images[0].getImageId();
      }
    }
  }
};

export default getFirstImageIdFromSeriesInstanceUid;
