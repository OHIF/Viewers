import {
  createDentalMeasurementExport,
  createDentalMeasurementExportFilename,
} from './dentalMeasurementExport';

describe('Dental Measurement Export', () => {
  const measurement = {
    id: 'backend-id-not-exported',
    annotationUID: 'annotation-1',
    presetId: 'pa-length',
    label: 'PA length',
    unit: 'mm',
    value: 12.4,
    toothId: 'permanent-1',
    note: 'Distal root',
    toolName: 'Length',
    viewportId: 'dental-current',
    displaySetInstanceUID: 'display-set-1',
    referenceSeriesUID: 'series-1',
    points: [[1, 2, 3], [4, 5, 6]],
    createdAt: '2026-06-18T01:00:00.000Z',
    updatedAt: '2026-06-18T02:00:00.000Z',
    metadata: {
      PatientName: 'Not Exported',
      PatientBirthDate: '19700101',
    },
  } as never;

  it('exports minimal identifiers, details, geometry, and timestamps', () => {
    const exported = createDentalMeasurementExport(
      {
        studyInstanceUID: '1.2.3',
        patientId: 'P-123',
        exportedAt: '2026-06-18T03:04:05.000Z',
      },
      [measurement]
    );

    expect(exported).toEqual({
      schemaVersion: 1,
      studyInstanceUID: '1.2.3',
      patientId: 'P-123',
      exportedAt: '2026-06-18T03:04:05.000Z',
      measurements: [
        {
          annotationUID: 'annotation-1',
          presetId: 'pa-length',
          label: 'PA length',
          unit: 'mm',
          value: 12.4,
          toothId: 'permanent-1',
          note: 'Distal root',
          toolName: 'Length',
          viewportId: 'dental-current',
          displaySetInstanceUID: 'display-set-1',
          referenceSeriesUID: 'series-1',
          geometry: {
            points: [[1, 2, 3], [4, 5, 6]],
          },
          createdAt: '2026-06-18T01:00:00.000Z',
          updatedAt: '2026-06-18T02:00:00.000Z',
        },
      ],
    });
  });

  it('excludes patient name, date of birth, backend ids, and metadata', () => {
    const json = JSON.stringify(
      createDentalMeasurementExport(
        {
          studyInstanceUID: '1.2.3',
          patientId: null,
          exportedAt: '2026-06-18T03:04:05.000Z',
        },
        [measurement]
      )
    );

    expect(json).not.toContain('PatientName');
    expect(json).not.toContain('PatientBirthDate');
    expect(json).not.toContain('Not Exported');
    expect(json).not.toContain('backend-id-not-exported');
    expect(json).not.toContain('"metadata"');
    expect(json).not.toContain('"patientId"');
  });

  it('creates the required UTC timestamped filename', () => {
    expect(
      createDentalMeasurementExportFilename('1.2.840.10008', new Date('2026-06-18T03:04:05Z'))
    ).toBe('dental-measurements-1.2.840.10008-20260618-030405.json');
  });
});
