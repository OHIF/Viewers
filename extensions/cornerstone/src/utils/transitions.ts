/**
 * It is a bell curved function that uses ease in out quadratic for css
 * transition timing function for each side of the curve.
 *
 * @param {number} x - The current time, in the range [0, 1].
 * @param {number} baseline - The baseline value to start from and return to.
 * @returns the value of the transition at time x.
 */
export function easeInOutBell(x: number, baseline: number): number {
  const alpha = 1 - baseline;

  // prettier-ignore
  if (x < 1 / 4) {
    return  4 * Math.pow(2 * x, 3) * alpha + baseline;
  } else if (x < 1 / 2) {
    return (1 - Math.pow(-4 * x + 2, 3) / 2) * alpha + baseline;
  } else if (x < 3 / 4) {
    return (1 - Math.pow(4 * x - 2, 3) / 2) * alpha + baseline;
  } else {
    return (- 4 * Math.pow(2 * x - 2, 3)) * alpha + baseline;
  }
}

/**
 * A reversed bell curved function that starts from 1 and goes to baseline and
 * come back to 1 again. It uses ease in out quadratic for css transition
 * timing function for each side of the curve.
 *
 * @param {number} x - The current time, in the range [0, 1].
 * @param {number} baseline - The baseline value to start from and return to.
 * @returns the value of the transition at time x.
 */
export function reverseEaseInOutBell(x: number, baseline: number): number {
  const y = easeInOutBell(x, baseline);
  return -y + 1 + baseline;
}
