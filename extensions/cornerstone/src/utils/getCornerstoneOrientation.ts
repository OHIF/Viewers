import { Enums } from '@cornerstonejs/core';
import { log } from '@ohif/core';

const AXIAL = 'axial';
const SAGITTAL = 'sagittal';
const CORONAL = 'coronal';

export default function getCornerstoneOrientation(
  orientation: string
): Enums.OrientationAxis {
  switch (orientation.toLowerCase()) {
    case AXIAL:
      return Enums.OrientationAxis.AXIAL;
    case SAGITTAL:
      return Enums.OrientationAxis.SAGITTAL;
    case CORONAL:
      return Enums.OrientationAxis.CORONAL;
    default:
      log.wanr('Choosing acquisition plane orientation');
      return Enums.OrientationAxis.ACQUISITION;
  }
}
