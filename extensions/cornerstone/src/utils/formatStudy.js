import moment from 'moment';

/**
 * Checks if value is valid.
 *
 * @param {number} value
 * @returns {boolean} is valid.
 */
function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Formats number precision.
 *
 * @param {number} number
 * @param {number} precision
 * @returns {number} formatted number.
 */
function formatNumberPrecision(number, precision) {
  if (number !== null) {
    return parseFloat(number).toFixed(precision);
  }
}

/**
 * Formats DICOM date.
 *
 * @param {string} date
 * @param {string} strFormat
 * @returns {string} formatted date.
 */
function formatDICOMDate(date, strFormat = 'MMM D, YYYY') {
  return moment(date, 'YYYYMMDD').format(strFormat);
}

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
 * @returns {string} formatted name.
 */
function formatDICOMTime(time, strFormat = 'HH:mm:ss') {
  return moment(time, 'HH:mm:ss').format(strFormat);
}

/**
 * Formats a patient name for display purposes
 *
 * @param {string} name
 * @returns {string} formatted name.
 */
function formatPN(name) {
  if (!name) {
    return;
  }

  // Convert the first ^ to a ', '. String.replace() only affects
  // the first appearance of the character.
  const commaBetweenFirstAndLast = name.replace('^', ', ');

  // Replace any remaining '^' characters with spaces
  const cleaned = commaBetweenFirstAndLast.replace(/\^/g, ' ');

  // Trim any extraneous whitespace
  return cleaned.trim();
}

/**
 * Gets compression type
 *
 * @param {number} imageId
 * @returns {string} comrpession type.
 */
function getCompression(imageId) {
  const generalImageModule =
    cornerstone.metaData.get('generalImageModule', imageId) || {};
  const {
    lossyImageCompression,
    lossyImageCompressionRatio,
    lossyImageCompressionMethod,
  } = generalImageModule;

  if (lossyImageCompression === '01' && lossyImageCompressionRatio !== '') {
    const compressionMethod = lossyImageCompressionMethod || 'Lossy: ';
    const compressionRatio = formatNumberPrecision(
      lossyImageCompressionRatio,
      2
    );
    return compressionMethod + compressionRatio + ' : 1';
  }

  return 'Lossless / Uncompressed';
}

export { isValidNumber,
  formatNumberPrecision,
  formatDICOMDate,
  formatDICOMTime,
  formatPN,
  getCompression
};
