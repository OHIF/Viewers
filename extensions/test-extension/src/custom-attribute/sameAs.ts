/**
 * This function extracts an attribute from the already matched display sets, and
 * compares it to the attribute in the current display set, and indicates if they match.
 * From 'this', it uses:
 *    `sameAttribute` as the attribute name to look for
 *    `sameDisplaySetId` as the display set id to look for
 * From `options`, it looks for
 */
export default function (displaySet, options) {
  const { sameAttribute, sameDisplaySetId } = this;
  if (!sameAttribute) {
    console.log('sameAttribute not defined in', this);
    return `sameAttribute not defined in ${this.id}`;
  }
  if (!sameDisplaySetId) {
    console.log('sameDisplaySetId not defined in', this);
    return `sameDisplaySetId not defined in ${this.id}`;
  }
  const { displaySetMatchDetails, displaySets } = options;
  const match = displaySetMatchDetails.get(sameDisplaySetId);
  if (!match) {
    console.log('No match for display set', sameDisplaySetId);
    return false;
  }
  const { displaySetInstanceUID } = match;
  const altDisplaySet = displaySets.find(it => it.displaySetInstanceUID == displaySetInstanceUID);
  if (!altDisplaySet) {
    console.log('No display set found with', displaySetInstanceUID, 'in', displaySets);
    return false;
  }
  const testValue = altDisplaySet[sameAttribute];
  return testValue === displaySet[sameAttribute];
}
