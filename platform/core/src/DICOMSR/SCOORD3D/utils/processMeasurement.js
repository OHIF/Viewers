import processTID1410Measurement from './processTID1410Measurement';
import processNonGeometricallyDefinedMeasurement from './processNonGeometricallyDefinedMeasurement';

const processMeasurement = contentSequence => {
  if (
    contentSequence.some(
      group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
    )
  ) {
    return processTID1410Measurement(contentSequence);
  }

  return processNonGeometricallyDefinedMeasurement(contentSequence);
};

export default processMeasurement;
