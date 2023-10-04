import formatDICOMPatientName from './formatDICOMPatientName';

describe('formatDICOMPatientName', () => {
  it('should format DICOM patient name correctly', () => {
    const patientName = 'Blackford^Test';
    const formattedPatientName = formatDICOMPatientName(patientName);
    expect(formattedPatientName).toEqual('Blackford, Test');
  });

  it('should return undefined it input is not a string', () => {
    expect(formatDICOMPatientName(123)).toEqual(undefined);
    expect(formatDICOMPatientName(null)).toEqual(undefined);
    expect(formatDICOMPatientName(undefined)).toEqual(undefined);
    expect(formatDICOMPatientName(false)).toEqual(undefined);
    expect(formatDICOMPatientName([])).toEqual(undefined);
  });
});
