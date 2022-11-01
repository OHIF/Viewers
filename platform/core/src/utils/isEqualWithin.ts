/**
 * returns equal if the two arrays are identical within the
 * given tolerance.
 *
 * @param v1 - The first array of values
 * @param v2 - The second array of values.
 * @param tolerance - The acceptable tolerance, the default is 0.00001
 *
 * @returns True if the two values are within the tolerance levels.
 */
export default function isEqualWithin(
  v1: number[] | Float32Array,
  v2: number[] | Float32Array,
  tolerance = 1e-5
): boolean {
  if (v1.length !== v2.length) {
    return false;
  }

  for (let i = 0; i < v1.length; i++) {
    if (Math.abs(v1[i] - v2[i]) > tolerance) {
      return false;
    }
  }

  return true;
}
