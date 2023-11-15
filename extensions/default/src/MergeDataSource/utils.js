/**
 * Executes a function given an object and a path to the function.
 * @param {Object} obj - The object containing the function to be executed.
 * @param {string} path - The path to the function, separated by dots.
 * @param {Array} args - An array of arguments to be passed to the function.
 * @returns {*} - The result of the executed function.
 */
export function executeFunction(obj, path, args) {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current[key] === undefined) {
      throw new Error(`Invalid path: ${path}`);
    }
    current = current[key];
  }

  if (typeof current !== 'function') {
    throw new Error(`Path does not lead to a function: ${path}`);
  }

  return current.apply(obj, args);
}

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
  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    if (typeof obj[currentKey] === 'object') {
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
  executeFunction,
  getKeyByLevel,
};

export default utils;
