import moment from 'moment';

/**
 * Formats DICOM date.
 *
 * @param {string} date
 * @param {string} strFormat
 */
export default function formatDICOMDate(date, strFormat = 'MMM D, YYYY') {
  return moment(date, 'YYYYMMDD').format(strFormat);
}
