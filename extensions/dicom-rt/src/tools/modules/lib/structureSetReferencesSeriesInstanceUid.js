/**
 * structureSetReferencesSeriesInstanceUid - Returns true if the structure set
 * references the given SeriesInstanceUID.
 * @param {*} StructureSet
 * @param {*} SeriesInstanceUID
 */
export default function structureSetReferencesSeriesInstanceUid(
  StructureSet,
  SeriesInstanceUID
) {
  const { referencedSeriesSequence } = StructureSet;
  return referencedSeriesSequence.some(
    referencedSeries =>
      referencedSeries.SeriesInstanceUID ===
      SeriesInstanceUID
  );
}
