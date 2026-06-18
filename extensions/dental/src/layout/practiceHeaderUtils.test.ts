import { formatHeaderValue, getPracticeName, getStudySummary } from './practiceHeaderUtils';

describe('Practice Header utilities', () => {
  it('prefers Dental Mode practice name from app config', () => {
    expect(getPracticeName({ dental: { practiceName: 'Northside Dental' } })).toBe(
      'Northside Dental'
    );
  });

  it('falls back to Dental Practice when no practice name is configured', () => {
    expect(getPracticeName({})).toBe('Dental Practice');
  });

  it('formats missing header values consistently', () => {
    expect(formatHeaderValue(null)).toBe('Not available');
    expect(formatHeaderValue('CT')).toBe('CT');
  });

  it('reads study summary from active display set metadata', () => {
    expect(
      getStudySummary({
        getActiveDisplaySets: () => [
          {
            instances: [
              {
                Modality: 'CT',
                StudyDate: '20140522',
              },
            ],
          },
        ],
      })
    ).toEqual({
      modality: 'CT',
      studyDate: '20140522',
    });
  });
});
