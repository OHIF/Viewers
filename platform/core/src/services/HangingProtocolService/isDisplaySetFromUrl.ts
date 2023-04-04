import { splitComma } from '../../utils';

/** Indicates if the given display set is the one specified in the
 * displaySet parameter in the URL
 * The parameters are:
 *    initialSeriesInstanceUID
 *    initialSOPInstanceUID
 */
const isDisplaySetFromUrl = (displaySet): boolean => {
  const params = new URLSearchParams(window.location.search);
  const displaySetSeriesInstanceUID = splitComma(
    params.getAll('initialSeriesInstanceUID')
  );
  let ret;
  if (displaySetSeriesInstanceUID.length) {
    const foundSeries = displaySetSeriesInstanceUID.indexOf(
      displaySet.instance?.SeriesInstanceUID
    );
    if (foundSeries === -1) return false;
    ret = true;
  }
  const displaySetSOPInstanceUID = splitComma(
    params.getAll('initialSOPInstanceUID')
  );
  if (displaySetSOPInstanceUID.length) {
    if (!displaySet.instances) return false;
    const instance = displaySet.instances.find(
      instance =>
        displaySetSOPInstanceUID.indexOf(instance.SOPInstanceUID) !== -1
    );
    return instance !== undefined;
  }
  return ret;
};

/** Returns the index location of the requested image, or the defaultValue in this */
function sopInstanceLocation(displaySets) {
  const displaySet = displaySets[0];
  if (!displaySet) return this.defaultValue;
  const params = new URLSearchParams(window.location.search);
  const initialSOPInstanceUID = [...params].find(
    ([key, value]) => key.toLowerCase() === 'initialsopinstanceuid' && value
  );
  if (!initialSOPInstanceUID) return this.defaultValue;
  const displaySetSOPInstanceUID = splitComma(initialSOPInstanceUID[1]);
  if (displaySetSOPInstanceUID.length === 0 || !displaySet.images) {
    return this.defaultValue;
  }
  const instanceIndex = displaySet.images.findIndex(
    instance => displaySetSOPInstanceUID.indexOf(instance.SOPInstanceUID) !== -1
  );
  return instanceIndex === -1 ? this.defaultValue : { index: instanceIndex };
}

export { isDisplaySetFromUrl, sopInstanceLocation };
