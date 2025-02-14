import { vec3 } from 'gl-matrix';

/**
 * Calculates the scanAxisNormal based on a image orientation vector extract from a frame
 * @param {*} imageOrientation
 * @returns
 */
export default function calculateScanAxisNormal(imageOrientation) {
  const rowCosineVec = vec3.fromValues(
    imageOrientation[0],
    imageOrientation[1],
    imageOrientation[2]
  );
  const colCosineVec = vec3.fromValues(
    imageOrientation[3],
    imageOrientation[4],
    imageOrientation[5]
  );
  return vec3.cross(vec3.create(), rowCosineVec, colCosineVec);
}
