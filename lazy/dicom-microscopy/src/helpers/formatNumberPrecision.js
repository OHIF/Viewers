/**
 * Formats a number to a fixed precision.
 *
 * @param {number} number
 * @param {number} precision
 */
export default function formatNumberPrecision(number, precision) {
  return Number(parseFloat(number).toFixed(precision));
}
