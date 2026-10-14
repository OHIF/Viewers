// Mock i18next so `t(key, fallback)` deterministically returns the fallback
// (the test env doesn't initialize i18n with resources).
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: (_key: string, fallback?: string) => fallback,
    language: 'en',
  },
}));

import { formatDICOMDate } from './formatDICOMDate';

describe('formatDICOMDate', () => {
  describe('valid DICOM dates', () => {
    it('formats YYYYMMDD with the default fallback (MMM D, YYYY)', () => {
      expect(formatDICOMDate('20180916')).toBe('Sep 16, 2018');
    });

    it('formats the YYYY.MM.DD variant', () => {
      expect(formatDICOMDate('2018.09.16')).toBe('Sep 16, 2018');
    });

    it('honors fallbackFormat', () => {
      expect(formatDICOMDate('20180916', { fallbackFormat: 'MMM-DD-YYYY' })).toBe('Sep-16-2018');
    });

    it('honors strFormat (overriding the locale key)', () => {
      expect(formatDICOMDate('20180916', { strFormat: 'YYYY-MM-DD' })).toBe('2018-09-16');
    });
  });

  describe('empty input', () => {
    it('returns empty string by default', () => {
      expect(formatDICOMDate('')).toBe('');
      expect(formatDICOMDate(undefined as unknown as string)).toBe('');
    });

    it('returns invalidFallback when provided', () => {
      expect(formatDICOMDate('', { invalidFallback: 'N/A' })).toBe('N/A');
    });
  });

  describe('invalid input', () => {
    it('preserves the prior lenient behavior when no invalidFallback is given', () => {
      // A non-DICOM but moment-parseable string still formats via the lenient parse.
      expect(formatDICOMDate('2018-09-16')).toBe('Sep 16, 2018');
      // Genuinely unparseable input yields moment's "Invalid date".
      expect(formatDICOMDate('garbage')).toBe('Invalid date');
    });

    it('returns invalidFallback for unparseable input when provided', () => {
      expect(formatDICOMDate('garbage', { invalidFallback: 'N/A' })).toBe('N/A');
    });

    it('invalidFallback short-circuits the lenient parse', () => {
      // Even though "2018-09-16" is loosely parseable, an explicit invalidFallback
      // wins because strict DICOM parsing failed.
      expect(formatDICOMDate('2018-09-16', { invalidFallback: 'N/A' })).toBe('N/A');
    });
  });
});
