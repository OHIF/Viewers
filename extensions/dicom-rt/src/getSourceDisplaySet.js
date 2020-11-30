export default function getSourceDisplaySet(studies, rtStructDisplaySet) {
  const referencedDisplaySet = _getReferencedDisplaySet(
    rtStructDisplaySet,
    studies
  );

  rtStructDisplaySet.load(referencedDisplaySet, studies);

  return referencedDisplaySet;
}

const _getReferencedDisplaySet = (rtStructDisplaySet, studies) => {
  let allDisplaySets = [];

  studies.forEach(study => {
    allDisplaySets = allDisplaySets.concat(study.displaySets);
  });

  const otherDisplaySets = allDisplaySets.filter(
    ds => ds.displaySetInstanceUID !== rtStructDisplaySet.displaySetInstanceUID
  );

  const ReferencedSeriesSequence = Array.isArray(
    rtStructDisplaySet.metadata.ReferencedSeriesSequence
  )
    ? rtStructDisplaySet.metadata.ReferencedSeriesSequence
    : [rtStructDisplaySet.metadata.ReferencedSeriesSequence];

  const referencedSeriesInstanceUIDs = ReferencedSeriesSequence.map(
    ReferencedSeries => ReferencedSeries.SeriesInstanceUID
  );

  const referencedDisplaySet = otherDisplaySets.find(ds =>
    referencedSeriesInstanceUIDs.includes(ds.SeriesInstanceUID)
  );

  return referencedDisplaySet;
};
