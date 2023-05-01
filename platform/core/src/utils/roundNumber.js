/**
 * @param {string | number} value
 * @param {number} decimals
 */
function _round(value, decimals) {
  return Number(value).toFixed(decimals);
}

export default _round;
