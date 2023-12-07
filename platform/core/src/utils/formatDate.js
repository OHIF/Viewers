import moment from 'moment';
import i18n from 'i18next';

/**
 * Format date
 *
 * @param {string} date Date to be formatted
 * @param {string} format Desired date format
 * @returns {string} Formatted date
 */
export default (date, format = i18n.t('Common:localDateFormat','DD-MMM-YYYY')) => {
  // moment(undefined) returns the current date, so return the empty string instead
  return date ? moment(date).format(format) : '';
};
