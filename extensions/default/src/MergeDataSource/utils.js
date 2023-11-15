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

const utils = {
  executeFunction,
  getKeyByLevel,
};

export default utils;
