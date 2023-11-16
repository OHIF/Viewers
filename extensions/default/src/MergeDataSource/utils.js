/**
 * Gets the value of a key in an object at a specified level.
 * @param {Object} obj - The object to search for the key.
 * @param {string} key - The key to search for.
 * @param {number} level - The level at which to search for the key.
 * @returns {*} - The value of the key if found, otherwise undefined.
 */
export function getKeyByLevel(obj, key, level) {
  if (level === 0) {
    return obj[key];
  }
  const keys = Object.keys(obj);
  for (const currentKey of keys) {
    if (obj[currentKey] !== null && typeof obj[currentKey] === 'object') {
      const result = getKeyByLevel(obj[currentKey], key, level - 1);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
}

/**
 * A collection of utility functions.
 */
const utils = {
  getKeyByLevel,
};

export default utils;
