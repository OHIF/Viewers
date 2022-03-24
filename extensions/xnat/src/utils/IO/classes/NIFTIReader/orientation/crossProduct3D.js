/**
 * crossProduct3D - Returns the cross product of a and b.
 *
 * @param  {Number[3]} a Vector a.
 * @param  {Number[3]} b Vector b.
 * @return {Number[3]}   The cross product.
 */
export default function(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
