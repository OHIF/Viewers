/**
 * Rounds a measured value the way the viewer displays it, to 3 significant digits, such as '152',
 * '77.0' or '0.312'. An array, such as a point, is rounded per value and joined with ', '.
 * Mirrors `roundNumber` in `@ohif/core` and `@cornerstonejs/core`, which the viewer uses for
 * segment statistics and measurement labels.
 */
export function roundNumber(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(roundNumber).join(', ');
  }
  if (value === undefined || value === null || value === '') {
    return 'NaN';
  }

  const number = Number(value);
  const absValue = Math.abs(number);
  if (absValue < 0.0001) {
    return `${number}`;
  }

  const decimals =
    absValue >= 100
      ? 0
      : absValue >= 10
        ? 1
        : absValue >= 1
          ? 2
          : absValue >= 0.1
            ? 3
            : absValue >= 0.01
              ? 4
              : absValue >= 0.001
                ? 5
                : 6;
  return number.toFixed(decimals);
}
