// Mock i18next so `t(key, fallback)` deterministically returns the fallback
// (the test env doesn't initialize i18n with resources).
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: (_key: string, fallback?: string) => fallback,
    language: 'en',
  },
}));

import { formatDICOMTime } from './formatDICOMTime';

describe('formatDICOMTime', () => {
  describe('valid DICOM times (default hh:mm A fallback)', () => {
    it('formats HHmmss', () => {
      expect(formatDICOMTime('143052')).toBe('02:30 PM');
    });

    it('formats HHmm', () => {
      expect(formatDICOMTime('0905')).toBe('09:05 AM');
    });

    it('formats HH', () => {
      expect(formatDICOMTime('14')).toBe('02:00 PM');
    });

    it('does not misread a 4-digit HHmm time as a year', () => {
      // The whole reason there is no lenient reparse: moment("1430") with no
      // format would yield the year 1430, not 14:30.
      expect(formatDICOMTime('1430')).toBe('02:30 PM');
    });

    it('formats HHmmss.SSSSSS (6 fractional digits, e.g. Orthanc)', () => {
      expect(formatDICOMTime('090323.000000')).toBe('09:03 AM');
    });

    it('formats HHmmss with variable fractional digit counts', () => {
      expect(formatDICOMTime('143052.1')).toBe('02:30 PM');
      expect(formatDICOMTime('143052.12')).toBe('02:30 PM');
      expect(formatDICOMTime('143052.123456')).toBe('02:30 PM');
    });
  });

  describe('format overrides', () => {
    it('uses strFormat when provided', () => {
      expect(formatDICOMTime('143052', { strFormat: 'HH:mm:ss' })).toBe('14:30:52');
      expect(formatDICOMTime('143052', { strFormat: 'HH:mm' })).toBe('14:30');
    });

    it('preserves non-zero fractional seconds with strFormat', () => {
      expect(formatDICOMTime('090323.123456', { strFormat: 'HH:mm:ss.SSS' })).toBe('09:03:23.123');
    });

    it('uses fallbackFormat for the locale-key-missing path', () => {
      expect(formatDICOMTime('143052', { fallbackFormat: 'HH:mm' })).toBe('14:30');
    });
  });

  describe('empty / invalid input', () => {
    it('returns empty string by default for empty input', () => {
      expect(formatDICOMTime('')).toBe('');
      expect(formatDICOMTime(undefined as unknown as string)).toBe('');
    });

    it('returns empty string by default for unparseable input', () => {
      expect(formatDICOMTime('notatime')).toBe('');
      // Out-of-range hour is invalid under strict parsing.
      expect(formatDICOMTime('2530')).toBe('');
    });

    it('rejects fractional seconds with more than 6 digits', () => {
      expect(formatDICOMTime('090323.1234567')).toBe('');
      expect(formatDICOMTime('090323.1234567', { invalidFallback: '--' })).toBe('--');
    });

    it('returns invalidFallback when provided', () => {
      expect(formatDICOMTime('', { invalidFallback: 'N/A' })).toBe('N/A');
      expect(formatDICOMTime('notatime', { invalidFallback: '--' })).toBe('--');
    });
  });
});
