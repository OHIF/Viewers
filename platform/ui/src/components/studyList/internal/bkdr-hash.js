/**
 * BKDR Hash (modified version)
 *
 * @param {String} str string to hash
 * @returns {Number}
 */
function BKDRHash(str) {
  const seed = 131;
  const seed2 = 137;
  let hash = 0;
  // make hash more sensitive for short string like 'a', 'b', 'c'
  str += 'x';
  // Note: Number.MAX_SAFE_INTEGER equals 9007199254740991
  var MAX_SAFE_INTEGER = parseInt(9007199254740991 / seed2);
  for (var i = 0; i < str.length; i++) {
    if (hash > MAX_SAFE_INTEGER) {
      hash = parseInt(hash / seed2);
    }
    hash = hash * seed + str.charCodeAt(i);
  }
  return hash;
}

export default BKDRHash;
