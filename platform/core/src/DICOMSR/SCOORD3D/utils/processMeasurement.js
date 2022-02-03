import processTID1410Measurement from './processTID1410Measurement';
import processNonGeometricallyDefinedMeasurement from './processNonGeometricallyDefinedMeasurement';

const processMeasurement = (mergedContentSequence, displaySet) => {
  if (
    mergedContentSequence.some(
      group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
    )
  ) {
    return processTID1410Measurement(mergedContentSequence, displaySet);
  }

  return processNonGeometricallyDefinedMeasurement(mergedContentSequence);
};

export default processMeasurement;
