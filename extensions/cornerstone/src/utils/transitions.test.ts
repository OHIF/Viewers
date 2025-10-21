import { linear, ease, easeIn, easeOut, easeInOut, cubicBezier } from './transitions';

describe('Transitions Module', () => {
  const EPSILON = 1e-6;

  /**
   * Helper function to check if two numbers are approximately equal
   */
  const approxEqual = (actual: number, expected: number, tolerance = EPSILON): boolean => {
    return Math.abs(actual - expected) < tolerance;
  };

  describe('Standard CSS Easing (Mode 1: no baseline)', () => {
    describe('linear', () => {
      it('should return 0 at timeProgress=0', () => {
        expect(linear(0)).toBe(0);
      });

      it('should return 1 at timeProgress=1', () => {
        expect(linear(1)).toBe(1);
      });

      it('should return timeProgress for linear progression', () => {
        expect(linear(0.25)).toBe(0.25);
        expect(linear(0.5)).toBe(0.5);
        expect(linear(0.75)).toBe(0.75);
      });
    });

    describe('easeInOut', () => {
      it('should return 0 at timeProgress=0', () => {
        expect(easeInOut(0)).toBe(0);
      });

      it('should return 1 at timeProgress=1', () => {
        expect(easeInOut(1)).toBe(1);
      });

      it('should return 0.5 at timeProgress=0.5', () => {
        const result = easeInOut(0.5);
        expect(approxEqual(result, 0.5)).toBe(true);
      });

      it('should be slower at start than linear', () => {
        const easedValue = easeInOut(0.2);
        expect(easedValue).toBeLessThan(0.2);
      });

      it('should provide smoothing toward the end', () => {
        const baseTime = 0.9;
        const controlTimeProgressionDifference = 0.2;

        const result1 = easeInOut(baseTime);
        const result2 = easeInOut(baseTime - controlTimeProgressionDifference);

        expect(result1 - result2).toBeLessThan(controlTimeProgressionDifference);
      });
    });

    describe('easeIn', () => {
      it('should return 0 at timeProgress=0', () => {
        expect(easeIn(0)).toBe(0);
      });

      it('should return 1 at timeProgress=1', () => {
        expect(easeIn(1)).toBe(1);
      });

      it('should be slower at start', () => {
        const easedValue = easeIn(0.4);
        expect(easedValue).toBeLessThan(0.4);
      });

      it('should accelerate toward the end', () => {
        const baseTime = 0.9;
        const controlTimeProgressionDifference = 0.2;

        const result1 = easeIn(baseTime);
        const result2 = easeIn(baseTime - controlTimeProgressionDifference);

        expect(result1 - result2).toBeGreaterThan(controlTimeProgressionDifference);
      });
    });

    describe('easeOut', () => {
      it('should return 0 at timeProgress=0', () => {
        expect(easeOut(0)).toBe(0);
      });

      it('should return 1 at timeProgress=1', () => {
        expect(easeOut(1)).toBe(1);
      });

      it('should be faster at start', () => {
        const easedValue = easeOut(0.4);
        expect(easedValue).toBeGreaterThan(0.4);
      });

      it('should provide smoothing toward the end', () => {
        const baseTime = 0.9;
        const controlTimeProgressionDifference = 0.2;

        const result1 = ease(baseTime);
        const result2 = ease(baseTime - controlTimeProgressionDifference);

        expect(result1 - result2).toBeLessThan(controlTimeProgressionDifference);
      });
    });

    describe('ease', () => {
      it('should return 0 at timeProgress=0', () => {
        expect(ease(0)).toBe(0);
      });

      it('should return 1 at timeProgress=1', () => {
        expect(ease(1)).toBe(1);
      });

      it('should provide significant growth at first half', () => {
        const result = ease(0.5);
        expect(result).toBeGreaterThan(0.75);
      });

      it('should provide smoothing toward the end', () => {
        const baseTime = 0.9;
        const controlTimeProgressionDifference = 0.2;

        const result1 = ease(baseTime);
        const result2 = ease(baseTime - controlTimeProgressionDifference);

        expect(result1 - result2).toBeLessThan(controlTimeProgressionDifference);
      });
    });
  });

  describe('Baseline Bell-Curve (Mode 2: baseline only)', () => {
    const baseline = 0.2;

    describe('linear with baseline', () => {
      it('should start and end at baseline', () => {
        expect(linear(0, baseline)).toBe(baseline);
        expect(linear(1, baseline)).toBe(baseline);
      });

      it('should peak at 1.0 at timeProgress=0.5', () => {
        const result = linear(0.5, baseline);
        expect(approxEqual(result, 1.0)).toBe(true);
      });

      it('should create symmetric bell curve', () => {
        const quarterValue = linear(0.25, baseline);
        const threeQuarterValue = linear(0.75, baseline);
        expect(approxEqual(quarterValue, threeQuarterValue)).toBe(true);
      });

      it('should be between baseline and 1.0', () => {
        for (let t = 0; t <= 1; t += 0.1) {
          const result = linear(t, baseline);
          expect(result).toBeGreaterThanOrEqual(baseline);
          expect(result).toBeLessThanOrEqual(1.0);
        }
      });
    });

    describe('easeInOut with baseline', () => {
      it('should start and end at baseline', () => {
        expect(easeInOut(0, baseline)).toBe(baseline);
        expect(easeInOut(1, baseline)).toBe(baseline);
      });

      it('should peak near 1.0 around timeProgress=0.5', () => {
        const result = easeInOut(0.5, baseline);
        expect(result).toBeGreaterThan(0.8);
        expect(result).toBeLessThanOrEqual(1.0);
      });

      it('should create bell curve with easing', () => {
        const quarterValue = easeInOut(0.25, baseline);
        const threeQuarterValue = easeInOut(0.75, baseline);
        expect(approxEqual(quarterValue, threeQuarterValue, 0.01)).toBe(true);
      });
    });

    describe('all functions with baseline', () => {
      const testBaseline = 0.3;

      it('should all start and end at baseline', () => {
        const functions = [linear, ease, easeIn, easeOut, easeInOut];

        functions.forEach(fn => {
          expect(fn(0, testBaseline)).toBe(testBaseline);
          expect(fn(1, testBaseline)).toBe(testBaseline);
        });
      });
    });
  });

  describe('Scaled Bell-Curve (Mode 3: baseline + scale)', () => {
    const baseline = 2.0;
    const scale = 3.0;
    const expectedPeak = baseline * scale;

    describe('linear with baseline and scale', () => {
      it('should start and end at baseline', () => {
        expect(linear(0, baseline, scale)).toBe(baseline);
        expect(linear(1, baseline, scale)).toBe(baseline);
      });

      it('should peak at baseline*scale at timeProgress=0.5', () => {
        const result = linear(0.5, baseline, scale);
        expect(approxEqual(result, expectedPeak)).toBe(true);
      });

      it('should create symmetric scaled bell curve', () => {
        const quarterValue = linear(0.25, baseline, scale);
        const threeQuarterValue = linear(0.75, baseline, scale);
        expect(approxEqual(quarterValue, threeQuarterValue)).toBe(true);
      });
    });

    describe('easeInOut with baseline and scale', () => {
      it('should start and end at baseline', () => {
        expect(easeInOut(0, baseline, scale)).toBe(baseline);
        expect(easeInOut(1, baseline, scale)).toBe(baseline);
      });

      it('should peak near baseline*scale around timeProgress=0.5', () => {
        const result = easeInOut(0.5, baseline, scale);
        expect(result).toBeGreaterThan(baseline + (expectedPeak - baseline) * 0.8);
        expect(result).toBeLessThanOrEqual(expectedPeak);
      });
    });

    describe('different scale values', () => {
      it('should handle scale < 1 (shrinking)', () => {
        const shrinkScale = 0.5;
        const result = linear(0.5, 1.0, shrinkScale);
        expect(approxEqual(result, 0.5)).toBe(true);
      });

      it('should handle scale > 1 (growing)', () => {
        const growScale = 2.5;
        const result = linear(0.5, 1.0, growScale);
        expect(approxEqual(result, 2.5)).toBe(true);
      });

      it('should handle scale = 1 (baseline to baseline)', () => {
        const result = linear(0.5, 0.5, 1);
        expect(approxEqual(result, 0.5)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    describe('baseline = 0 behavior', () => {
      it('should behave like standard easing when baseline=0', () => {
        expect(linear(0.5, 0)).toBe(linear(0.5));
        expect(easeInOut(0.5, 0)).toBe(easeInOut(0.5));
      });
    });

    describe('extreme values', () => {
      it('should handle negative baseline', () => {
        const result = linear(0.5, -1.0, 2.0);
        expect(approxEqual(result, -2.0)).toBe(true);
      });

      it('should handle large baseline values', () => {
        const result = linear(0.5, 100, 1.5);
        expect(approxEqual(result, 150)).toBe(true);
      });
    });

    describe('timeProgress edge cases', () => {
      it('should handle timeProgress < 0', () => {
        expect(linear(-0.1)).toBe(0);
        expect(easeInOut(-0.1, 0.2)).toBe(0.2);
      });

      it('should handle timeProgress > 1', () => {
        expect(linear(1.1)).toBe(1);
        expect(easeInOut(1.1, 0.2)).toBe(0.2);
      });
    });
  });

  describe('Mathematical Properties', () => {
    describe('bell curve symmetry for symmetric cubic bezier functions', () => {
      it('should be symmetric around timeProgress=0.5', () => {
        const baseline = 0.1;
        const scale = 2.0;

        [linear, easeInOut].forEach(fn => {
          for (let offset = 0.1; offset <= 0.4; offset += 0.1) {
            const leftValue = fn(0.5 - offset, baseline, scale);
            const rightValue = fn(0.5 + offset, baseline, scale);
            expect(approxEqual(leftValue, rightValue, 0.01)).toBe(true);
          }
        });
      });
    });

    describe('monotonicity in first half', () => {
      it('should be non-decreasing from 0 to 0.5 for functions that grow under linear in first half', () => {
        const baseline = 0.2;

        [linear, easeIn, easeInOut].forEach(fn => {
          let prevValue = fn(0, baseline);
          for (let time = 0.1; time <= 0.5; time += 0.1) {
            const currentValue = fn(time, baseline);
            expect(currentValue).toBeGreaterThanOrEqual(prevValue - EPSILON);
            prevValue = currentValue;
          }
        });
      });
    });
  });

  describe('Utility Functions', () => {
    describe('cubicBezier', () => {
      it('should create functions that return 0 at t=0 and 1 at t=1', () => {
        const customEasing = cubicBezier(0.25, 0.1, 0.75, 0.9);
        expect(customEasing(0)).toBe(0);
        expect(customEasing(1)).toBe(1);
      });

      it('should throw error for invalid x values', () => {
        expect(() => cubicBezier(-0.1, 0, 1, 1)).toThrow();
        expect(() => cubicBezier(0, 0, 1.1, 1)).toThrow();
      });

      it('should fallback to binary search when Newton-Raphson fails due to small derivative', () => {
        /**
         * Create a cubic-bezier curve that has a very flat section (small derivative)
         * This will cause Newton-Raphson to fail and use binary search fallback
         * Using control points that create a nearly horizontal tangent
         * Obs: Values obtained by imperative testing
         */
        const problematicEasing = cubicBezier(0.98888, 0.00001, 0.00001, 0.98888);

        /** Test a value in the problematic region where derivative is very small*/
        const result = problematicEasing(0.5);

        expect(typeof result).toBe('number');
        expect(isNaN(result)).toBe(false);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance Validation', () => {
    it('should handle many rapid calls without issues', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const t = i / 1000;
        linear(t);
        easeInOut(t, 0.1);
        ease(t, 0.2, 1.5);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(10);
    });
  });
});
