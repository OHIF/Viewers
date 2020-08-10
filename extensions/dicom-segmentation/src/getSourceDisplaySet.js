import setActiveLabelmap from './utils/setActiveLabelMap';

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

  const ReferencedSeriesSequence = Array.isArray(
    segDisplaySet.metadata.ReferencedSeriesSequence
  )
    ? segDisplaySet.metadata.ReferencedSeriesSequence
    : [segDisplaySet.metadata.ReferencedSeriesSequence];

  const referencedSeriesInstanceUIDs = ReferencedSeriesSequence.map(
    ReferencedSeries => ReferencedSeries.SeriesInstanceUID
  );

  const referencedDisplaySet = otherDisplaySets.find(ds =>
    referencedSeriesInstanceUIDs.includes(ds.SeriesInstanceUID)
  );

  return referencedDisplaySet;
};
