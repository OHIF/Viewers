import { isEmpty } from 'lodash';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const _sopInstanceUidToImageIdMap = {};

const getSopInstanceUidToImageIdMap = () => {
  if (!isEmpty(_sopInstanceUidToImageIdMap)) {
    return _sopInstanceUidToImageIdMap;
  }

  const studies = studyMetadataManager.all();

  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      const displaySet = displaySets[j];
      const { images } = displaySet;

      if (!images) {
        continue;
      }

      for (let k = 0; k < images.length; k++) {
        const image = images[k];
        const sopInstanceUID = image.getSOPInstanceUID();
        const { metadata } = image.getData();
        let imageId = image.getImageId();
        if (metadata.NumberOfFrames > 1 && !imageId.includes('frame=')) {
          imageId = `${imageId}?frame=0`;
        }

        _sopInstanceUidToImageIdMap[sopInstanceUID] = imageId;
      }
    }
  }

  return _sopInstanceUidToImageIdMap;
};

export default getSopInstanceUidToImageIdMap;
