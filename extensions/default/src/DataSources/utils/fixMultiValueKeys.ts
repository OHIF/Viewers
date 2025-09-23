/**
 * Fix multi-valued keys so that those which are strings split by
 * a backslash are returned as arrays.
 */
export function fixMultiValueKeys(naturalData, keys = ['ImageType']) {
  for (const key of keys) {
    if (typeof naturalData[key] === 'string') {
      naturalData[key] = naturalData[key].split('\\');
    }
  }
  return naturalData;
}
