import moment from 'moment';

/**
 * Parses a DICOM study date and time into a timestamp for sorting.
 *
 * @param date - Raw date string (YYYYMMDD or YYYY.MM.DD format)
 * @param time - Raw time string (HH, HHmm, HHmmss, or HHmmss.SSS format)
 * @returns Timestamp in milliseconds, or 0 if the date is missing/invalid
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
