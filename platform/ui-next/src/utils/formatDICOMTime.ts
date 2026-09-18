import moment from 'moment';
import i18n from 'i18next';

export interface FormatDICOMTimeOptions {
  /**
   * Explicit output format. When provided it overrides the locale's
   * `Common:localTimeFormat`; when omitted the locale key is used.
   */
  strFormat?: string;
  /**
   * Output format used when the active locale does not define
   * `Common:localTimeFormat` (none of the shipped locales do today, so in
   * practice this is what renders). Defaults to `hh:mm A`.
   */
  fallbackFormat?: string;
  /** Returned when `time` is empty or cannot be parsed. Defaults to `''`. */
  invalidFallback?: string;
}

/**
 * Formats a DICOM time.
 *
 * @param time - Raw time string (e.g. `HH`, `HHmm`, `HHmmss`, `HHmmss.SSS`).
 * @param options - See {@link FormatDICOMTimeOptions}.
 * @returns The formatted time, or the resolved invalid fallback.
 *
 * @example
 * formatDICOMTime(time, { invalidFallback: '' });
 */
export function formatDICOMTime(time: string, options: FormatDICOMTimeOptions = {}): string {
  const { strFormat, fallbackFormat = 'hh:mm A', invalidFallback } = options;

  if (!time) {
    return invalidFallback ?? '';
  }

  const format = strFormat ?? i18n.t('Common:localTimeFormat', fallbackFormat);
  const locale = i18n.language || 'en';
  const parsed = moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);

  // Unlike formatDICOMDate, there is no lenient reparse: a no-format
  // moment(time) treats the string as a date (e.g. "1430" -> year 1430), so an
  // unparseable time falls straight back rather than fabricating a wrong value.
  if (!parsed.isValid()) {
    return invalidFallback ?? '';
  }

  return parsed.locale(locale).format(format);
}
