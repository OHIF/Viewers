import { defaults, utils } from '@ohif/core';
import { utilities } from '@cornerstonejs/tools';
import { vec3 } from 'gl-matrix';

const { orientationDirectionVectorMap } = defaults;
const { getOrientationStringLPS } = utilities.orientation;

type IOP = [number, number, number, number, number, number];
type PO = [string, string] | string;
type IL = string;
type FL = string;
type Instance = {
  ImageOrientationPatient?: IOP;
  PatientOrientation?: PO;
  ImageLaterality?: IL;
  FrameLaterality?: FL;
};

/**
 * A function to get required flipping to correct the image according to Orientation and Laterality.
 * This function does not handle rotated images.
 * @param instance Metadata instance of the image.
 * @returns vertical and horizontal flipping needed to correct the image if possible.
 */
export function getImageFlips(instance: Instance): { vFlip?: boolean; hFlip?: boolean } {
  const { ImageOrientationPatient, PatientOrientation, ImageLaterality, FrameLaterality } =
    instance;

  if (!(ImageOrientationPatient || PatientOrientation) || !(ImageLaterality || FrameLaterality)) {
    console.warn(
      'Skipping image orientation correction due to missing ImageOrientationPatient/ PatientOrientation or/and ImageLaterality/ FrameLaterality'
    );
    return {};
  }

  let rowDirectionCurrent, columnDirectionCurrent, rowCosines, columnCosines;
  if (ImageOrientationPatient) {
    rowCosines = ImageOrientationPatient.slice(0, 3);
    columnCosines = ImageOrientationPatient.slice(3, 6);
    rowDirectionCurrent = getOrientationStringLPS(rowCosines);
    columnDirectionCurrent = getOrientationStringLPS(columnCosines)[0];
  } else {
    ({ rowDirection: rowDirectionCurrent, columnDirection: columnDirectionCurrent } =
      utils.getDirectionsFromPatientOrientation(PatientOrientation));

    rowCosines = orientationDirectionVectorMap[rowDirectionCurrent];
    columnCosines = orientationDirectionVectorMap[columnDirectionCurrent];
  }

  const scanAxisNormal = vec3.create();
  vec3.cross(scanAxisNormal, rowCosines, columnCosines);

  const scanAxisDirection = getOrientationStringLPS(scanAxisNormal as [number, number, number]);

  if (isImageRotated(rowDirectionCurrent, columnDirectionCurrent)) {
    // TODO: Correcting images with rotation is not implemented.
    console.warn('Correcting images by rotating is not implemented');
    return {};
  }

  let rowDirectionTarget, columnDirectionTarget;
  switch (scanAxisDirection[0]) {
    // Sagittal
    case 'L':
    case 'R':
      if ((ImageLaterality || FrameLaterality) === 'L') {
        rowDirectionTarget = 'A';
      } else {
        rowDirectionTarget = 'P';
      }
      columnDirectionTarget = 'F';
      break;
    // Coronal
    case 'A':
    case 'P':
      if ((ImageLaterality || FrameLaterality) === 'L') {
        rowDirectionTarget = 'R';
      } else {
        rowDirectionTarget = 'L';
      }
      columnDirectionTarget = 'F';
      break;
    // Axial
    case 'H':
    case 'F':
      if ((ImageLaterality || FrameLaterality) === 'L') {
        rowDirectionTarget = 'A';
        columnDirectionTarget = 'R';
      } else {
        rowDirectionTarget = 'P';
        columnDirectionTarget = 'L';
      }
      break;
  }

  let hFlip = false,
    vFlip = false;
  if (rowDirectionCurrent !== rowDirectionTarget) {
    hFlip = true;
  }
  if (columnDirectionCurrent !== columnDirectionTarget) {
    vFlip = true;
  }

  return { hFlip, vFlip };
}

function isImageRotated(rowDirection: string, columnDirection: string): boolean {
  const possibleValues: { [key: string]: [string, string] } = {
    xDirection: ['L', 'R'],
    yDirection: ['P', 'A'],
    zDirection: ['H', 'F'],
  };

  if (
    possibleValues.yDirection.includes(columnDirection) ||
    possibleValues.zDirection.includes(rowDirection)
  ) {
    return true;
  }

  return false;
}
