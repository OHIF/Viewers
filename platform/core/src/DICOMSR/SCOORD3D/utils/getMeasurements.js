import { CodeNameCodeSequenceValues } from '../enums';
import getSequenceAsArray from './getSequenceAsArray';
import getMergedContentSequencesByTrackingUniqueIdentifiers from './getMergedContentSequencesByTrackingUniqueIdentifiers';
import processMeasurement from './processMeasurement';

const getMeasurements = (
  ImagingMeasurementReportContentSequence,
  displaySet
) => {
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

  const mergedContentSequencesByTrackingUniqueIdentifiers = getMergedContentSequencesByTrackingUniqueIdentifiers(
    MeasurementGroups
  );

  let measurements = [];

  Object.keys(mergedContentSequencesByTrackingUniqueIdentifiers).forEach(
    trackingUniqueIdentifier => {
      const mergedContentSequence =
        mergedContentSequencesByTrackingUniqueIdentifiers[
          trackingUniqueIdentifier
        ];

      const measurement = processMeasurement(mergedContentSequence, displaySet);
      if (measurement) {
        measurements.push(measurement);
      }
    }
  );

  return measurements;
};

export default getMeasurements;
