import moment from 'moment';
import i18n from 'i18next';

export interface FormatDICOMDateOptions {
  /**
   * Explicit output format. When provided it overrides the locale's
   * `Common:localDateFormat`; when omitted the locale key is used.
   */
  strFormat?: string;
  /**
   * Output format used only when the active locale does not define
   * `Common:localDateFormat` (8 of the shipped locales don't). Defaults to
   * `MMM D, YYYY`.
   */
  fallbackFormat?: string;
  /**
   * Returned when `date` is empty or cannot be parsed as a date at all. When
   * omitted, the prior behavior is preserved: a lenient `moment(date).format(...)`
   * is returned (which is `"Invalid date"` for unparseable input).
   */
  invalidFallback?: string;
}

/**
 * Formats a DICOM date.
 *
 * @param date - Raw date string (e.g. `YYYYMMDD` or `YYYY.MM.DD`).
 * @param options - See {@link FormatDICOMDateOptions}.
 * @returns The formatted date, or the resolved invalid fallback.
 *
 * @remarks
 * Migration: this previously took a positional format argument
 * (`formatDICOMDate(date, strFormat?)`). That format — and the additional
 * `fallbackFormat` / `invalidFallback` options — are now passed as a single
 * options object.
 *
 * @example
 * // Before (positional):
 * formatDICOMDate(date, 'YYYY-MM-DD');
 * // After (options object):
 * formatDICOMDate(date, { strFormat: 'YYYY-MM-DD' });
 *
 * @example
 * formatDICOMDate(date, { fallbackFormat: 'DD-MMM-YYYY', invalidFallback: '' });
 */
export function formatDICOMDate(date: string, options: FormatDICOMDateOptions = {}): string {
  const { strFormat, fallbackFormat = 'MMM D, YYYY', invalidFallback } = options;

  if (!date) {
    return invalidFallback ?? '';
  }

  const format = strFormat ?? i18n.t('Common:localDateFormat', fallbackFormat);
  const locale = i18n.language || 'en';
  const parsed = moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  if (!parsed.isValid()) {
    // Honor an explicit fallback, otherwise preserve prior behavior (a lenient
    // parse, which formats valid non-DICOM strings and yields "Invalid date"
    // for unparseable input).
    return invalidFallback ?? moment(date).locale(locale).format(format);
  }

  return parsed.locale(locale).format(format);
}
