/**
 * Truncates decimal points to that there is at least 1+precision significant
 * digits.
 *
 * For example, with the default precision 2 (3 significant digits)
 * * Values larger than 100 show no information after the decimal point
 * * Values between 10 and 99 show 1 decimal point
 * * Values between 1 and 9 show 2 decimal points
 *
 * @param value - to return a fixed measurement value from
 * @param precision - defining how many digits after 1..9 are desired
 */
function roundNumber(value: string | number, precision = 2): string {
  if (value === undefined || value === null || value === '') return 'NaN';
  value = Number(value);
  if (value < 0.0001) return `${value}`;
  const fixedPrecision =
    value >= 100
      ? precision - 2
      : value >= 10
        ? precision - 1
        : value >= 1
          ? precision
          : value >= 0.1
            ? precision + 1
            : value >= 0.01
              ? precision + 2
              : value >= 0.001
                ? precision + 3
                : precision + 4;
  return value.toFixed(fixedPrecision);
}

export default roundNumber;
