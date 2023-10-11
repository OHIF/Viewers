import moment from 'moment';

/**
 * Format date
 *
 * @param {string} date Date to be formatted
 * @param {string} format Desired date format
 * @returns {string} Formatted date
 */
export default (date, format = 'DD-MMM-YYYY') => {
  // moment(undefined) returns the current date, so return the empty string instead
  return date ? moment(date).format(format) : '';
};
