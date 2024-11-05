import { OrientationDirections } from '../types';

export default function getDirectionsFromPatientOrientation(
  patientOrientation: string | [string, string]
): OrientationDirections {
  if (typeof patientOrientation === 'string') {
    patientOrientation = patientOrientation.split('\\') as [string, string];
  }

  // TODO: We are only considering first direction in column orientation.
  // ex: in ['P', 'HL'], we are only taking 'H' instead of 'HL' as column orientation.
  return {
    rowDirection: patientOrientation[0],
    columnDirection: patientOrientation[1][0],
  };
}
