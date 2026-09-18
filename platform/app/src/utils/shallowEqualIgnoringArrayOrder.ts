/**
 * Shallow equality for two flat record-shaped objects, with one twist:
 * array values are compared as unordered sets (so `[1, 2]` is equal to
 * `[2, 1]`). Scalar values are compared with strict `===`.
 *
 * Limitation: this is a *shallow* comparison. Nested objects are compared
 * by reference; this function does not recurse. It is intended for flat
 * records whose values are primitives or arrays of primitives.
 *
 * @param {object} a - First object
 * @param {object} b - Second object
 * @returns {boolean} True if the two are equal under the rules above.
 */
export function shallowEqualIgnoringArrayOrder(a, b): boolean {
  if (!a || !b) {
    return a === b;
  }

  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    const val1 = a[key];
    const val2 = b[key];

    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) {
        return false;
      }
      const s1 = new Set(val1);
      const s2 = new Set(val2);
      if (s1.size !== s2.size) {
        return false;
      }
      for (const v of s2.values()) {
        if (!s1.has(v)) {
          return false;
        }
      }
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}
