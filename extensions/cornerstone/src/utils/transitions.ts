/** Cubic Bezier Implementation */

/**
 * Finds the parameter t for a given x value on a cubic Bézier curve.
 * Uses Newton's method first (fast), then falls back to binary search (reliable).
 * Based on WebKit/Chromium's UnitBezier implementation.
 *
 * @param {number} targetX - The x value to find parameter t for
 * @param {number} x1 - x-coordinate of first control point
 * @param {number} x2 - x-coordinate of second control point
 * @returns {number} The parameter t that gives the specified x value
 */
function solveCubicBezierX(targetX: number, x1: number, x2: number): number {
  const epsilon = 1e-6;

  // Pre-compute polynomial coefficients for performance
  const cx = 3.0 * x1;
  const bx = 3.0 * (x2 - x1) - cx;
  const ax = 1.0 - cx - bx;

  function sampleCurveX(t: number): number {
    // Evaluate: ax*t³ + bx*t² + cx*t using Horner's rule
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleCurveDerivativeX(t: number): number {
    return (3.0 * ax * t + 2.0 * bx) * t + cx;
  }

  /**
   * Newton's method - fast convergence with good initial guess
   * Try this first as it's normally very fast
   */
  function newtonRaphsonMethod(targetX: number): number | null {
    let t = targetX;

    for (let iteration = 0; iteration < 8; iteration++) {
      const currentX = sampleCurveX(t);
      const error = currentX - targetX;

      if (Math.abs(error) < epsilon) {
        return t;
      }

      const derivative = sampleCurveDerivativeX(t);

      // Break if derivative is too small (avoid division by zero)
      if (Math.abs(derivative) < epsilon) {
        break;
      }

      // Newton-Raphson step: t_new = t_old - f(t_old) / f'(t_old)
      t = t - error / derivative;
    }

    return null;
  }

  /**
   * Binary search fallback - guaranteed to converge
   * Use this when Newton's method fails
   */
  function binarySearchFallback(targetX: number): number {
    let lowerBound = 0.0;
    let upperBound = 1.0;
    let t = targetX;

    while (lowerBound < upperBound) {
      const currentX = sampleCurveX(t);

      if (Math.abs(currentX - targetX) < epsilon) {
        return t;
      }

      if (targetX > currentX) {
        lowerBound = t;
      } else {
        upperBound = t;
      }

      t = (upperBound - lowerBound) * 0.5 + lowerBound;
    }

    return t;
  }

  const newtonResult = newtonRaphsonMethod(targetX);
  if (newtonResult !== null) {
    return newtonResult;
  }

  return binarySearchFallback(targetX);
}

/**
 * Evaluates the Y coordinate of a cubic Bézier curve at parameter t.
 * Optimized for CSS timing functions where P0=(0,0) and P3=(1,1).
 * Uses pre-computed polynomial coefficients and Horner's rule for performance.
 *
 * @param {number} t - Parameter value along the curve, typically in [0, 1]
 * @param {number} y1 - y-coordinate of first control point
 * @param {number} y2 - y-coordinate of second control point
 * @returns {number} The Y value of the curve at parameter t
 */
function sampleCurveY(t: number, y1: number, y2: number): number {
  // Pre-compute polynomial coefficients for performance
  const cy = 3.0 * y1;
  const by = 3.0 * (y2 - y1) - cy;
  const ay = 1.0 - cy - by;

  // Evaluate: ay*t³ + by*t² + cy*t using Horner's rule
  return ((ay * t + by) * t + cy) * t;
}

/**
 * Cubic Bézier easing function implementation following CSS specifications.
 *
 * A cubic Bézier curve is defined by four points: P0, P1, P2, and P3.
 * In CSS animations, P0 is fixed at (0, 0) and P3 is fixed at (1, 1).
 * This function allows you to specify the intermediate control points P1 and P2.
 *
 * @param {number} x1 - x-coordinate of the first control point P1 (must be in [0, 1])
 * @param {number} y1 - y-coordinate of the first control point P1
 * @param {number} x2 - x-coordinate of the second control point P2 (must be in [0, 1])
 * @param {number} y2 - y-coordinate of the second control point P2
 * @returns {function} A function that takes time t ∈ [0, 1] and returns the eased value
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error('x1 and x2 must be in the range [0, 1]');
  }

  return function (timeProgress: number): number {
    if (timeProgress <= 0) return 0;
    if (timeProgress >= 1) return 1;

    if (x1 === y1 && x2 === y2) {
      return timeProgress;
    }

    const curveParameter = solveCubicBezierX(timeProgress, x1, x2);
    return sampleCurveY(curveParameter, y1, y2);
  };
}
