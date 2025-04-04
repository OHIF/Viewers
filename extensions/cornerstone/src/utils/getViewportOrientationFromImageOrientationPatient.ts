import { CONSTANTS, utilities } from '@cornerstonejs/core';

const { MPR_CAMERA_VALUES } = CONSTANTS;

/**
 * Determines the viewport orientation (axial, sagittal, or coronal) based on the image orientation patient values.
 * This is done by comparing the view vectors with predefined MPR camera values.
 *
 * @param imageOrientationPatient - Array of 6 numbers representing the image orientation patient values.
 * The first 3 numbers represent the direction cosines of the first row and the second 3 numbers
 * represent the direction cosines of the first column.
 *
 * @returns The viewport orientation as a string ('axial', 'sagittal', 'coronal') or undefined if
 * the orientation cannot be determined or if the input is invalid.
 *
 * @example
 * ```typescript
 * const orientation = getViewportOrientationFromImageOrientationPatient([1,0,0,0,1,0]);
 * console.debug(orientation); // 'axial'
 * ```
 */
export const getViewportOrientationFromImageOrientationPatient = (
  imageOrientationPatient: number[]
): string | undefined => {
  if (!imageOrientationPatient || imageOrientationPatient.length !== 6) {
    return undefined;
  }

  const viewRight = imageOrientationPatient.slice(0, 3);
  const viewDown = imageOrientationPatient.slice(3, 6);
  const viewUp = [-viewDown[0], -viewDown[1], -viewDown[2]];

  // Compare vectors with MPR camera values using utilities.isEqual
  if (
    utilities.isEqual(viewRight, MPR_CAMERA_VALUES.axial.viewRight) &&
    utilities.isEqual(viewUp, MPR_CAMERA_VALUES.axial.viewUp)
  ) {
    return 'axial';
  }

  if (
    utilities.isEqual(viewRight, MPR_CAMERA_VALUES.sagittal.viewRight) &&
    utilities.isEqual(viewUp, MPR_CAMERA_VALUES.sagittal.viewUp)
  ) {
    return 'sagittal';
  }

  if (
    utilities.isEqual(viewRight, MPR_CAMERA_VALUES.coronal.viewRight) &&
    utilities.isEqual(viewUp, MPR_CAMERA_VALUES.coronal.viewUp)
  ) {
    return 'coronal';
  }

  return undefined;
};
