import moment from 'moment';
import i18n from 'i18next';
import * as cornerstone from '@cornerstonejs/core';
import { formatDICOMDate } from '@ohif/ui-next';

/**
 * Checks if value is valid.
 *
 * @param {number} value
 * @returns {boolean} is valid.
 */
export function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Formats number precision.
 *
 * @param {number} number
 * @param {number} precision
 * @returns {number} formatted number.
 */
export function formatNumberPrecision(number, precision) {
  if (number !== null) {
    return parseFloat(number).toFixed(precision);
  }
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
export function formatDICOMTime(time, strFormat = 'HH:mm:ss') {
  return moment(time, 'HH:mm:ss').format(strFormat);
}

/**
 * Gets compression type
 *
 * @param {number} imageId
 * @returns {string} compression type.
 */
export function getCompression(imageId) {
  const generalImageModule = cornerstone.metaData.get('generalImageModule', imageId) || {};
  const { lossyImageCompression, lossyImageCompressionRatio, lossyImageCompressionMethod } =
    generalImageModule;

  if (lossyImageCompression === '01' && lossyImageCompressionRatio !== '') {
    const compressionMethod = lossyImageCompressionMethod || 'Lossy: ';
    const compressionRatio = formatNumberPrecision(lossyImageCompressionRatio, 2);
    return compressionMethod + compressionRatio + ' : 1';
  }

  return 'Lossless / Uncompressed';
}

export { formatDICOMDate };
