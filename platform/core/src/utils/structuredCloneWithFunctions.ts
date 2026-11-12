/**
 * Clones the object, incorporating functions as functions in the result.
 */
export function structuredCloneWithFunctions(obj, seen = new WeakMap()) {
  // Handle null, primitives, and functions
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (typeof obj === 'function') {
    return obj; // copy function by reference
  }

  // Handle circular references
  if (seen.has(obj)) {
    return seen.get(obj);
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // Handle Array
  if (Array.isArray(obj)) {
    const arrCopy = [];
    seen.set(obj, arrCopy);
    for (const item of obj) {
      arrCopy.push(structuredCloneWithFunctions(item, seen));
    }
    return arrCopy;
  }

  // Handle Object
  const copy = {};
  seen.set(obj, copy);
  for (const key of Object.keys(obj)) {
    copy[key] = structuredCloneWithFunctions(obj[key], seen);
  }
  return copy;
}
