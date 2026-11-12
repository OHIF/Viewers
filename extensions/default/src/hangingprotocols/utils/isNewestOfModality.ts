import { utils } from '@ohif/core';

const { getLatestInstanceDateTimeSortKey } = utils;

const sortKey = displaySet => getLatestInstanceDateTimeSortKey(displaySet.instance ?? displaySet);

/**
 * True when no other display set of the study with the same Modality is newer,
 * by the date/time of the instance that each display set shows. A protocol
 * gives this a weight to put the newest display set first, because display
 * sets with the same score otherwise sort by SeriesNumber.
 */
export default function isNewestOfModality(displaySet, options): boolean {
  const key = sortKey(displaySet);
  return !options?.displaySets?.some(
    other =>
      other !== displaySet && other.Modality === displaySet.Modality && sortKey(other) > key
  );
}
