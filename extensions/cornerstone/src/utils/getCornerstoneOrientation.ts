import { CONSTANTS } from '@cornerstonejs/core';
import { log } from '@ohif/core';

const AXIAL = 'axial';
const SAGITTAL = 'sagittal';
const CORONAL = 'coronal';

export default function getCornerstoneOrientation(
  orientation: string
): CONSTANTS.ORIENTATION {
  switch (orientation.toLowerCase()) {
    case AXIAL:
      return CONSTANTS.ORIENTATION.AXIAL;
    case SAGITTAL:
      return CONSTANTS.ORIENTATION.SAGITTAL;
    case CORONAL:
      return CONSTANTS.ORIENTATION.CORONAL;
    default:
      log.wanr('Choosing default orientation: axial');
      return CONSTANTS.ORIENTATION.AXIAL;
  }
}
