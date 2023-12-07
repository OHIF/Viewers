const getLabelFromMeasuredValueSequence = (
  ConceptNameCodeSequence,
  MeasuredValueSequence
) => {
  const { CodeMeaning } = ConceptNameCodeSequence;
  const { NumericValue, MeasurementUnitsCodeSequence } = MeasuredValueSequence;
  const { CodeValue } = MeasurementUnitsCodeSequence;

  const formatedNumericValue = NumericValue
    ? Number(NumericValue).toFixed(1)
    : '';

  return {
    label: CodeMeaning,
    value: `${formatedNumericValue} ${CodeValue}`,
  }; // E.g. Long Axis: 31.0 mm
};

export default getLabelFromMeasuredValueSequence;
