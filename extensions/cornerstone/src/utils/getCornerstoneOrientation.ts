import { Enums } from '@cornerstonejs/core';

const AXIAL = 'axial';
const SAGITTAL = 'sagittal';
const CORONAL = 'coronal';

export default function getCornerstoneOrientation(orientation: string): Enums.OrientationAxis {
  if (orientation) {
    switch (orientation.toLowerCase()) {
      case AXIAL:
        return Enums.OrientationAxis.AXIAL;
      case SAGITTAL:
        return Enums.OrientationAxis.SAGITTAL;
      case CORONAL:
        return Enums.OrientationAxis.CORONAL;
      default:
        return Enums.OrientationAxis.ACQUISITION;
    }
  }

  return Enums.OrientationAxis.ACQUISITION;
}
