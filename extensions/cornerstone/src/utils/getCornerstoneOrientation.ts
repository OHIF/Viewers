import { Enums } from '@cornerstonejs/core';

const AXIAL = 'axial';
const SAGITTAL = 'sagittal';
const CORONAL = 'coronal';
const AXIAL_REFORMAT = 'axial_reformat';
const SAGITTAL_REFORMAT = 'sagittal_reformat';
const CORONAL_REFORMAT = 'coronal_reformat';

export default function getCornerstoneOrientation(orientation: string): Enums.OrientationAxis {
  if (orientation) {
    switch (orientation.toLowerCase()) {
      case AXIAL:
        return Enums.OrientationAxis.AXIAL;
      case AXIAL_REFORMAT:
        return Enums.OrientationAxis.AXIAL_REFORMAT;
      case SAGITTAL:
        return Enums.OrientationAxis.SAGITTAL;
      case SAGITTAL_REFORMAT:
        return Enums.OrientationAxis.SAGITTAL_REFORMAT;
      case CORONAL:
        return Enums.OrientationAxis.CORONAL;
      case CORONAL_REFORMAT:
        return Enums.OrientationAxis.CORONAL_REFORMAT;
      default:
        return Enums.OrientationAxis.ACQUISITION;
    }
  }

  return Enums.OrientationAxis.ACQUISITION;
}
