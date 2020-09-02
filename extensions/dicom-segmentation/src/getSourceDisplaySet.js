import setActiveLabelmap from './utils/setActiveLabelMap';
import { classes } from '@ohif/core';

const { ImageSet } = classes;

export default function getSourceDisplaySet(studies, segDisplaySet) {
  const referencedDisplaySet = _getReferencedDisplaySet(segDisplaySet, studies);

  setActiveLabelmap(referencedDisplaySet, studies, segDisplaySet);

  return referencedDisplaySet;
}

const _getReferencedDisplaySet = (segDisplaySet, studies) => {
  let allDisplaySets = [];

  studies.forEach(study => {
    allDisplaySets = allDisplaySets.concat(study.displaySets);
  });

  const otherDisplaySets = allDisplaySets.filter(
    ds => ds.displaySetInstanceUID !== segDisplaySet.displaySetInstanceUID
  );

  const { metadata } = segDisplaySet;

  let referencedSeriesInstanceUIDs;

  if (metadata.ReferencedSeriesSequence) {
    const ReferencedSeriesSequence = _toArray(
      metadata.ReferencedSeriesSequence
    );

    referencedSeriesInstanceUIDs = ReferencedSeriesSequence.map(
      ReferencedSeries => ReferencedSeries.SeriesInstanceUID
    );
  } else {
    const { PerFrameFunctionalGroupsSequence } = metadata;

    let SourceImageSequence;

    if (metadata.SourceImageSequence) {
      SourceImageSequence = metadata.SourceImageSequence;
    } else {
      const firstFunctionalGroups = _toArray(
        PerFrameFunctionalGroupsSequence
      )[0];
      const { DerivationImageSequence } = firstFunctionalGroups;

      SourceImageSequence = DerivationImageSequence;
    }

    const firstSourceImage = _toArray(SourceImageSequence)[0];

    const { ReferencedSOPInstanceUID } = firstSourceImage;

    referencedSeriesInstanceUIDs = _findReferencedSeriesInstanceUIDsFromSOPInstanceUID(
      otherDisplaySets,
      ReferencedSOPInstanceUID
    );
  }

  const referencedDisplaySet = otherDisplaySets.find(ds =>
    referencedSeriesInstanceUIDs.includes(ds.SeriesInstanceUID)
  );

  return referencedDisplaySet;
};

const _findReferencedSeriesInstanceUIDsFromSOPInstanceUID = (
  displaySets,
  SOPInstanceUID
) => {
  const imageSets = displaySets.filter(ds => ds instanceof ImageSet);

  for (let i = 0; i < imageSets.length; i++) {
    const { images } = imageSets[i];
    for (let j = 0; j < images.length; j++) {
      if (images[j].SOPInstanceUID === SOPInstanceUID) {
        return [images[j].getData().metadata.SeriesInstanceUID];
      }
    }
  }
};

function _toArray(arrayOrObject) {
  return Array.isArray(arrayOrObject) ? arrayOrObject : [arrayOrObject];
}
