import toScalarNumber from './toScalarNumber';
import toNumber from './toNumber';

describe('toScalarNumber', () => {
  it('reads a present value, however DICOM JSON shaped it', () => {
    expect(toScalarNumber(3)).toBe(3);
    expect(toScalarNumber('0.6')).toBe(0.6);
    expect(toScalarNumber([3])).toBe(3);
  });

  it('reports an empty attribute as absent rather than as an empty array', () => {
    // The defect: `toNumber([])` is `[]`, and `[]` is truthy, so `if (value)` accepts
    // it. Cornerstone took it as the z-spacing of a single-image volume and the
    // viewport went blank.
    expect(toNumber([])).toEqual([]);
    expect(Boolean(toNumber([]))).toBe(true);

    expect(toScalarNumber([])).toBeUndefined();
  });

  it('reports a missing or unreadable attribute as absent', () => {
    expect(toScalarNumber(undefined)).toBeUndefined();
    expect(toScalarNumber('not a number')).toBeUndefined();
    expect(toScalarNumber([undefined])).toBeUndefined();
  });

  it('does not turn an empty or null value into a thickness of zero', () => {
    // `toNumber` sends both through `Number()`, which is how a tag that said nothing
    // would otherwise come back as a measurement of 0.
    expect(toNumber('')).toBe(0);
    expect(toNumber(null)).toBe(0);

    expect(toScalarNumber('')).toBeUndefined();
    expect(toScalarNumber(null)).toBeUndefined();
  });

  it('keeps zero, which is a value and not an absence', () => {
    // Consumers guard with `if (value)` and treat 0 as absent on their own terms.
    // Turning it into `undefined` here would be a second, hidden decision.
    expect(toScalarNumber(0)).toBe(0);
  });
});
