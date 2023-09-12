import { vec3 } from 'gl-matrix';
import toNumber from '@ohif/core/src/utils/toNumber';
import { _getPerpendicularDistance } from '@ohif/core/src/utils/isDisplaySetReconstructable';
import calculateScanAxisNormal from '../calculateScanAxisNormal';

/**
 * Checks if there is a position shift between consecutive frames
 * @param {*} previousPosition
 * @param {*} actualPosition
 * @param {*} scanAxisNormal
 * @param {*} averageSpacingBetweenFrames
 * @returns
 */
function _checkSeriesPositionShift(
  previousPosition,
  actualPosition,
  scanAxisNormal,
  averageSpacingBetweenFrames
) {
  // predicted position should be the previous position added by the multiplication
  // of the scanAxisNormal and the average spacing between frames
  const predictedPosition = vec3.scaleAndAdd(
    vec3.create(),
    previousPosition,
    scanAxisNormal,
    averageSpacingBetweenFrames
  );
  return vec3.distance(actualPosition, predictedPosition) > averageSpacingBetweenFrames;
}

/**
 * Checks if a series has position shifts between consecutive frames
 * @param {*} instances
 * @returns
 */
export default function areAllImagePositionsEqual(instances: Array<any>): boolean {
  if (!instances?.length) {
    return false;
  }
  const firstImageOrientationPatient = toNumber(instances[0].ImageOrientationPatient);
  if (!firstImageOrientationPatient) {
    return false;
  }
  const scanAxisNormal = calculateScanAxisNormal(firstImageOrientationPatient);
  const firstImagePositionPatient = toNumber(instances[0].ImagePositionPatient);
  const lastIpp = toNumber(instances[instances.length - 1].ImagePositionPatient);

  const averageSpacingBetweenFrames =
    _getPerpendicularDistance(firstImagePositionPatient, lastIpp) / (instances.length - 1);

  let previousImagePositionPatient = firstImagePositionPatient;
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const imagePositionPatient = toNumber(instance.ImagePositionPatient);

    if (
      _checkSeriesPositionShift(
        previousImagePositionPatient,
        imagePositionPatient,
        scanAxisNormal,
        averageSpacingBetweenFrames
      )
    ) {
      return false;
    }
    previousImagePositionPatient = imagePositionPatient;
  }
  return true;
}
