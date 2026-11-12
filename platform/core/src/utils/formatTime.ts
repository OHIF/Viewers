import moment from 'moment';

/**
 * Format time in HHmmss.SSS format (24h time) into HH:mm:ss
 *
 * @param time - Time to be formatted
 * @param format - Desired time format
 * @returns Formatted time
 */
export default function formatTime(time: string, format = 'HH:mm:ss') {
  return moment(time, 'HH:mm:ss').format(format);
}
