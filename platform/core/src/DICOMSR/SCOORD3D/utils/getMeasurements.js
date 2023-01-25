import { CodeNameCodeSequenceValues } from '../enums';
import getSequenceAsArray from './getSequenceAsArray';
import processMeasurement from './processMeasurement';

const getMeasurements = (
  ImagingMeasurementReportContentSequence,
  SRSeriesInstanceUID,
  index
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

  let measurements = [];

  MeasurementGroups.forEach(MeasurementGroup => {
    const contentSequence = MeasurementGroup.ContentSequence;
    const measurement = processMeasurement(contentSequence);
    if (measurement) {
      measurement.seriesInstanceUID = SRSeriesInstanceUID;
      if (index === 0) {
        measurement.isVisible = true;
        measurement.labels.forEach(label => (label.visible = true));
      } else {
        measurement.isVisible = false;
        measurement.labels.forEach(label => (label.visible = false));
      }
      measurements.push(measurement);
    }
  });

  return measurements;
};

export default getMeasurements;
