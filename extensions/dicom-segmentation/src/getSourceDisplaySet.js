import setActiveLabelmap from './utils/setActiveLabelMap';
import { classes } from '@ohif/core';

const { ImageSet } = classes;

export default function getSourceDisplaySet(studies, segDisplaySet, activateLabelMap = true, onDisplaySetLoadFailureHandler) {
  const referencedDisplaySet = _getReferencedDisplaySet(segDisplaySet, studies);

  if (activateLabelMap) {
    setActiveLabelmap(referencedDisplaySet, studies, segDisplaySet, undefined, onDisplaySetLoadFailureHandler);
  }

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
  }

  if (metadata.ReferencedImageSequence &&
    (!referencedSeriesInstanceUIDs || referencedSeriesInstanceUIDs.length === 0)) {
    const referencedImageArray = _toArray(metadata.ReferencedImageSequence);
    for (let i = 0; i < referencedImageArray.length; i++) {
      const { ReferencedSOPInstanceUID } = referencedImageArray[i];

      referencedSeriesInstanceUIDs = _findReferencedSeriesInstanceUIDsFromSOPInstanceUID(
        otherDisplaySets,
        ReferencedSOPInstanceUID
      );

      if (referencedSeriesInstanceUIDs && referencedSeriesInstanceUIDs.length !== 0) {
        break;
      }
    }
  }

  if (!referencedSeriesInstanceUIDs || referencedSeriesInstanceUIDs.length === 0) {
    let SourceImageSequence;

    if (metadata.SourceImageSequence) {
      SourceImageSequence = metadata.SourceImageSequence;
    } else {
      const { PerFrameFunctionalGroupsSequence } = metadata;
      const firstFunctionalGroups = _toArray(
        PerFrameFunctionalGroupsSequence
      )[0];
      const { DerivationImageSequence } = firstFunctionalGroups;

      SourceImageSequence = DerivationImageSequence;
    }

    const sourceImageArray = _toArray(SourceImageSequence);
    for (let i = 0; i < sourceImageArray.length; i++) {
      const { ReferencedSOPInstanceUID } = sourceImageArray[i];

      referencedSeriesInstanceUIDs = _findReferencedSeriesInstanceUIDsFromSOPInstanceUID(
        otherDisplaySets,
        ReferencedSOPInstanceUID
      );

      if (referencedSeriesInstanceUIDs && referencedSeriesInstanceUIDs.length !== 0) {
        break;
      }
    }
  }

  if (!referencedSeriesInstanceUIDs || referencedSeriesInstanceUIDs.length === 0) {
    return undefined;
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
