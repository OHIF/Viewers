import moment from 'moment';

/**
 *    DICOM Time is stored as HHmmss.SSS, where:
 *      HH 24 hour time:
 *        m mm        0..59   Minutes
 *        s ss        0..59   Seconds
 *        S SS SSS    0..999  Fractional seconds
 *
 *        Goal: '24:12:12'
 *
 * @param {*} time
 * @param {string} strFormat
 */
export default function formatDICOMTime(time, strFormat = 'HH:mm:ss') {
  return moment(time, 'HH:mm:ss').format(strFormat);
}
