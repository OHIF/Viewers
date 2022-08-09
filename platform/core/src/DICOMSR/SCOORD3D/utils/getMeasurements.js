import { CodeNameCodeSequenceValues } from '../enums';
import getSequenceAsArray from './getSequenceAsArray';
import getMergedContentSequencesByTrackingUniqueIdentifiers from './getMergedContentSequencesByTrackingUniqueIdentifiers';
import processMeasurement from './processMeasurement';

const getMeasurements = ImagingMeasurementReportContentSequence => {
  const ImagingMeasurements = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImagingMeasurements
  );

  const MeasurementGroups = getSequenceAsArray(
    ImagingMeasurements.ContentSequence
  ).filter(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.MeasurementGroup
  );

  /* const mergedContentSequencesByTrackingUniqueIdentifiers = getMergedContentSequencesByTrackingUniqueIdentifiers(
    MeasurementGroups
  );*/

  let measurements = [];

  MeasurementGroups.forEach(MeasurementGroup => {
    const contentSequence = MeasurementGroup.ContentSequence;
    const measurement = processMeasurement(contentSequence);
    if (measurement) {
      measurements.push(measurement);
    }
  });

  return measurements;
};

export default getMeasurements;
