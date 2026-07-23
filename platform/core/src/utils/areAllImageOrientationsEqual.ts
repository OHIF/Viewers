import toNumber from './toNumber';
import { _isSameOrientation } from './isDisplaySetReconstructable';

/**
 * Check is the series has frames with different orientations
 * @param {*} instances
 * @returns
 */
export default function areAllImageOrientationsEqual(instances: Array<any>): boolean {
  if (!instances?.length) {
    return false;
  }
  const firstImage = instances[0];
  const firstImageOrientationPatient = toNumber(firstImage.ImageOrientationPatient);

  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const imageOrientationPatient = toNumber(instance.ImageOrientationPatient);

    if (!_isSameOrientation(imageOrientationPatient, firstImageOrientationPatient)) {
      return false;
    }
  }
  return true;
}
