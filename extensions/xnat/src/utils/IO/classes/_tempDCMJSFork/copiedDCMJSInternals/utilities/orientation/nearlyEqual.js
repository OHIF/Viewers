/**
 * NearlyEqual - Returns true if a and b are nearly equal
 * within a tolerance.
 *
 * This function logic source comes from:
 * https://floating-point-gui.de/errors/comparison/
 *
 * https://floating-point-gui.de is published under
 * the Creative Commons Attribution License (BY):
 * http://creativecommons.org/licenses/by/3.0/
 *
 * @param {Number} a
 * @param {Number} b
 * @param {Number} tolerance.
 * @returns {Boolean} True if a and b are nearly equal.
 */
export default function nearlyEqual(a, b, epsilon) {
  const absA = Math.abs(a);
  const absB = Math.abs(b);
  const diff = Math.abs(a - b);

  if (a === b) {
    // Shortcut, handles infinities
    return true;
  } else if (a === 0 || b === 0 || absA + absB < epsilon * epsilon) {
    // A or b is zero or both are extremely close to it
    // relative error is less meaningful here
    return diff < epsilon;
  }
  // Use relative error
  return diff / Math.min(absA + absB, Number.MAX_VALUE) < epsilon;
}
