import crossProduct3D from './crossProduct3D.js';
import rotateVectorAroundUnitVector from './rotateVectorAroundUnitVector.js';

/**
 * RotateDirectionCosinesInPlane - rotates the row and column cosines around
 * their normal by angle theta.
 *
 * @param  {Number[6]} iop   The row (0..2) an column (3..5) direction cosines.
 * @param  {Number} theta The rotation magnitude in radians.
 * @return {Number[6]}       The rotate row (0..2) and column (3..5) direction cosines.
 */
export default function(iop, theta) {
  const r = [iop[0], iop[1], iop[2]];
  const c = [iop[3], iop[4], iop[5]];
  const rxc = crossProduct3D(r, c);

  const rRot = rotateVectorAroundUnitVector(r, rxc, theta);
  const cRot = rotateVectorAroundUnitVector(c, rxc, theta);

  return [...rRot, ...cRot];
}
