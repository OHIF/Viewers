import { parseStudyDateTimestamp } from './parseStudyDateTimestamp';

describe('parseStudyDateTimestamp', () => {
  it('parses date + time into the matching local timestamp', () => {
    // Month is 0-indexed in the Date constructor; both use local time, so this
    // is timezone-independent.
    const expected = new Date(2018, 8, 16, 14, 30, 52).getTime();
    expect(parseStudyDateTimestamp('20180916', '143052')).toBe(expected);
  });

  it('defaults to midnight when no time is given', () => {
    const expected = new Date(2018, 8, 16, 0, 0, 0, 0).getTime();
    expect(parseStudyDateTimestamp('20180916')).toBe(expected);
  });

  it('ignores an invalid time (treats as midnight)', () => {
    expect(parseStudyDateTimestamp('20180916', 'notatime')).toBe(
      parseStudyDateTimestamp('20180916')
    );
  });

  it('returns 0 for missing or invalid dates', () => {
    expect(parseStudyDateTimestamp(undefined, '143052')).toBe(0);
    expect(parseStudyDateTimestamp('')).toBe(0);
    expect(parseStudyDateTimestamp('garbage')).toBe(0);
  });

  describe('ordering (the sort use case)', () => {
    it('orders by date', () => {
      expect(parseStudyDateTimestamp('20180916')).toBeGreaterThan(
        parseStudyDateTimestamp('20180915')
      );
    });

    it('uses time as a tiebreaker within the same date', () => {
      expect(parseStudyDateTimestamp('20180916', '130000')).toBeGreaterThan(
        parseStudyDateTimestamp('20180916', '120000')
      );
    });

    it('treats equal date + time as a true tie (equal keys)', () => {
      expect(parseStudyDateTimestamp('20180916', '120000')).toBe(
        parseStudyDateTimestamp('20180916', '120000')
      );
    });
  });
});
