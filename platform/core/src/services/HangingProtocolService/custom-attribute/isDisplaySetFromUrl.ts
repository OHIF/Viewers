import { getSplitParam } from '../../../utils';

/** Indicates if the given display set is the one specified in the
 * displaySet parameter in the URL
 * The parameters are:
 *    initialSeriesInstanceUID
 *    initialSOPInstanceUID
 */
const isDisplaySetFromUrl = (displaySet): boolean => {
  const params = new URLSearchParams(window.location.search);
  const initialSeriesInstanceUID = getSplitParam('initialseriesinstanceuid', params);
  const initialSOPInstanceUID = getSplitParam('initialsopinstanceuid', params);
  if (!initialSeriesInstanceUID && !initialSOPInstanceUID) {
    return false;
  }

  const isSeriesMatch = initialSeriesInstanceUID?.some(
    seriesUID => displaySet.SeriesInstanceUID === seriesUID
  );

  const isSopMatch = initialSOPInstanceUID?.some(sopUID =>
    displaySet.instances?.some(instance => sopUID === instance.SOPInstanceUID)
  );

  return isSeriesMatch || isSopMatch;
};

/** Returns the index location of the requested image, or the defaultValue in this.
 * Returns undefined to fallback to the defaultValue
 */
function sopInstanceLocation(displaySets) {
  const displaySet = displaySets?.[0];
  if (!displaySet) {
    return;
  }
  const initialSOPInstanceUID = getSplitParam('initialsopinstanceuid');
  if (!initialSOPInstanceUID) {
    return;
  }

  const index = displaySet.instances.findIndex(instance =>
    initialSOPInstanceUID.includes(instance.SOPInstanceUID)
  );
  // Need to return in the initial position specified format.
  return index === -1 ? undefined : { index };
}

export { isDisplaySetFromUrl, sopInstanceLocation };
