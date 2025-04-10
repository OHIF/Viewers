import crossProduct3D from './crossProduct3D.js';

/**
 * RotateVectorAroundUnitVector - Rotates vector v around unit vector k using
 *                                Rodrigues' rotation formula.
 *
 * @param  {Number[3]} v     The vector to rotate.
 * @param  {Number[3]} k     The unit vector of the axis of rotation.
 * @param  {Number} theta    The rotation magnitude in radians.
 * @return {Number[3]}       The rotated v vector.
 */
export default function(v, k, theta) {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const oneMinusCosTheta = 1.0 - cosTheta;
  const kdotv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const vRot = [];
  const kxv = crossProduct3D(k, v);

  for (let i = 0; i <= 2; i++) {
    vRot[i] =
      v[i] * cosTheta + kxv[i] * sinTheta + k[i] * kdotv * oneMinusCosTheta;

    vRot[i] *= -1;
  }

  return vRot;
}
