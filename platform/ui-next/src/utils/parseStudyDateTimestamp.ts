import moment from 'moment';

/**
 * Parses a DICOM study date and time into a timestamp for sorting.
 *
 * @param date - Raw date string (YYYYMMDD or YYYY.MM.DD format)
 * @param time - Raw DICOM TM string (HH, HHmm, HHmmss, or HHmmss.FFFFFF with 1–6 fractional digits)
 * @returns Timestamp in milliseconds, or 0 if the date is missing/invalid
 */
export function parseStudyDateTimestamp(date?: string, time?: string): number {
  const mDate = date && moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  // DICOM TM allows at most 6 fractional digits; reject longer fractions
  // before Moment's greedy SSSSSS parser silently accepts them.
  const validTime = time && !/\.\d{7,}/.test(time);
  const mTime =
    validTime && moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS', 'HHmmss.SSSSSS'], true);

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
