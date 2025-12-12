import moment from 'moment';

/**
 * Formats a DICOM study date and time for display.
 *
 * @param date - Raw date string (YYYYMMDD or YYYY.MM.DD format)
 * @param time - Raw time string (HH, HHmm, HHmmss, or HHmmss.SSS format)
 * @returns Formatted date string (DD-MMM-YYYY HH:mm) or empty string if invalid
 */
export function formatStudyDate(date?: string, time?: string): string {
  const mDate = date && moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const mTime = time && moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);

  if (mDate && mDate.isValid()) {
    const d = mDate.format('DD-MMM-YYYY');
    const t = mTime && mTime.isValid() ? mTime.format('HH:mm') : '';
    return t ? `${d} ${t}` : d;
  }
  return '';
}

/**
 * Parses a DICOM study date and time into a timestamp for sorting.
 *
 * @param date - Raw date string (YYYYMMDD or YYYY.MM.DD format)
 * @param time - Raw time string (HH, HHmm, HHmmss, or HHmmss.SSS format)
 * @returns Timestamp in milliseconds, or 0 if invalid
 */
export function parseStudyDateTimestamp(date?: string, time?: string): number {
  const mDate = date && moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const mTime = time && moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS'], true);

  if (mDate && mDate.isValid()) {
    const md = mDate.clone();
    if (mTime && mTime.isValid()) {
      md.set({
        hour: mTime.hour(),
        minute: mTime.minute(),
        second: mTime.second(),
        millisecond: mTime.millisecond(),
      });
    }
    return md.toDate().getTime();
  }
  return 0;
}
