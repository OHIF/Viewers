/**
 * structureSetReferencesSeriesInstanceUid - Returns true if the structure set
 * references the given SeriesInstanceUID.
 * @param {*} structureSet
 * @param {*} referencedSeriesInstanceUid
 */
export default function structureSetReferencesSeriesInstanceUid(
  structureSet,
  referencedSeriesInstanceUid
) {
  const { referencedSeriesSequence } = structureSet;

  return referencedSeriesSequence.some(
    referencedSeries =>
      referencedSeries.referencedSeriesInstanceUID ===
      referencedSeriesInstanceUid
  );
}
