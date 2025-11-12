import moment from 'moment';
import i18n from 'i18next';

/**
 * Formats DICOM date.
 *
 * @param {string} date
 * @param {string} strFormat
 */
export default function formatDICOMDate(date, strFormat) {
  if (!date) {
    return '';
  }

  const format = strFormat ?? i18n.t('Common:localDateFormat', 'MMM D, YYYY');
  const locale = i18n.language || 'en';
  const parsed = moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  if (!parsed.isValid()) {
    return moment(date).locale(locale).format(format);
  }

  return parsed.locale(locale).format(format);
}
