/**
 * Truncates decimal points to that there is at least 1+precision significant
 * digits.
 *
 * For example, with the default precision 2 (3 significant digits)
 * * Values larger than 100 show no information after the decimal point
 * * Values between 10 and 99 show 1 decimal point
 * * Values between 1 and 9 show 2 decimal points
 *
 * Trailing zeros after the decimal point are removed: 8 gives `8`, 12.30
 * gives `12.3`.
 *
 * @param value - to return a fixed measurement value from
 * @param precision - defining how many digits after 1..9 are desired
 */

function roundNumber(value, precision = 2) {
  if (Array.isArray(value)) {
    return value.map(v => roundNumber(v, precision)).join(', ');
  }
  if (value === undefined || value === null || value === '') {
    return 'NaN';
  }
  value = Number(value);
  const absValue = Math.abs(value);
  if (absValue < 0.0001) {
    return `${value}`;
  }
  const fixedPrecision =
    absValue >= 100
      ? precision - 2
      : absValue >= 10
        ? precision - 1
        : absValue >= 1
          ? precision
          : absValue >= 0.1
            ? precision + 1
            : absValue >= 0.01
              ? precision + 2
              : absValue >= 0.001
                ? precision + 3
                : precision + 4;
  const text = value.toFixed(fixedPrecision);
  // Same output as roundNumber of @cornerstonejs/core: no trailing zeros, no -0.
  // toFixed gives exponential text from 1e21; trimming would cut its exponent.
  const trimmed = text.includes('.') && !text.includes('e') ? text.replace(/\.?0+$/, '') : text;
  return trimmed === '-0' ? '0' : trimmed;
}

export default roundNumber;
