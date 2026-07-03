/**
 * Get referenced SM displaySet from SR displaySet
 *
 * @param {*} allDisplaySets
 * @param {*} microscopySRDisplaySet
 * @returns
 */
export default function getSourceDisplaySet(allDisplaySets, microscopySRDisplaySet) {
  const { ReferencedFrameOfReferenceUID, metadata } = microscopySRDisplaySet;

  if (metadata.ReferencedSeriesSequence) {
    const { ReferencedSeriesSequence } = metadata;
    const referencedSeries = ReferencedSeriesSequence[0];
    const { SeriesInstanceUID } = referencedSeries;
    const displaySets = allDisplaySets.filter(ds => ds.SeriesInstanceUID === SeriesInstanceUID);
    return displaySets[0];
  }

  const otherDisplaySets = allDisplaySets.filter(
    ds => ds.displaySetInstanceUID !== microscopySRDisplaySet.displaySetInstanceUID
  );
  const referencedDisplaySet = otherDisplaySets.find(
    displaySet =>
      displaySet.Modality === 'SM' &&
      (displaySet.FrameOfReferenceUID === ReferencedFrameOfReferenceUID ||
        // sometimes each depth instance has the different FrameOfReferenceID
        displaySet.othersFrameOfReferenceUID.includes(ReferencedFrameOfReferenceUID))
  );

  if (!referencedDisplaySet && otherDisplaySets.length >= 1) {
    console.warn(
      'No display set with FrameOfReferenceUID',
      ReferencedFrameOfReferenceUID,
      'single series, assuming data error, defaulting to only series.'
    );
    return otherDisplaySets.find(displaySet => displaySet.Modality === 'SM');
  }

  return referencedDisplaySet;
}
