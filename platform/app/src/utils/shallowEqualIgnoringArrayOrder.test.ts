import { shallowEqualIgnoringArrayOrder } from './shallowEqualIgnoringArrayOrder';

describe('shallowEqualIgnoringArrayOrder', () => {
  describe('null / undefined handling', () => {
    it('treats two nullish values with strict equality', () => {
      expect(shallowEqualIgnoringArrayOrder(null, null)).toBe(true);
      expect(shallowEqualIgnoringArrayOrder(undefined, undefined)).toBe(true);
      // null !== undefined
      expect(shallowEqualIgnoringArrayOrder(null, undefined)).toBe(false);
    });

    it('returns false when only one side is nullish', () => {
      expect(shallowEqualIgnoringArrayOrder(null, {})).toBe(false);
      expect(shallowEqualIgnoringArrayOrder({}, null)).toBe(false);
      expect(shallowEqualIgnoringArrayOrder({ a: 1 }, undefined)).toBe(false);
    });
  });

  describe('scalar values', () => {
    it('returns true for equal flat records', () => {
      expect(shallowEqualIgnoringArrayOrder({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    });

    it('returns true for two empty objects', () => {
      expect(shallowEqualIgnoringArrayOrder({}, {})).toBe(true);
    });

    it('returns false when a scalar value differs', () => {
      expect(shallowEqualIgnoringArrayOrder({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('compares scalars with strict equality (no coercion)', () => {
      expect(shallowEqualIgnoringArrayOrder({ a: 1 }, { a: '1' })).toBe(false);
    });
  });

  describe('keys present on only one side', () => {
    it('returns false when one object has an extra defined key', () => {
      expect(shallowEqualIgnoringArrayOrder({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(shallowEqualIgnoringArrayOrder({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('treats a missing key as equal to an explicit undefined value', () => {
      // b.y is absent, a.y is undefined — both read as undefined, so equal.
      expect(shallowEqualIgnoringArrayOrder({ x: 1, y: undefined }, { x: 1 })).toBe(true);
    });
  });

  describe('array values (order-insensitive)', () => {
    it('treats arrays as equal regardless of element order', () => {
      expect(shallowEqualIgnoringArrayOrder({ m: [1, 2, 3] }, { m: [3, 1, 2] })).toBe(true);
      expect(shallowEqualIgnoringArrayOrder({ m: ['CT', 'MR'] }, { m: ['MR', 'CT'] })).toBe(true);
    });

    it('returns false when arrays have different lengths', () => {
      expect(shallowEqualIgnoringArrayOrder({ m: [1, 2] }, { m: [1, 2, 3] })).toBe(false);
    });

    it('returns false when arrays of equal length have different elements', () => {
      expect(shallowEqualIgnoringArrayOrder({ m: [1, 2] }, { m: [1, 3] })).toBe(false);
    });

    it('returns false when one value is an array and the other is not', () => {
      expect(shallowEqualIgnoringArrayOrder({ m: [1] }, { m: 1 })).toBe(false);
      expect(shallowEqualIgnoringArrayOrder({ m: 'CT' }, { m: ['CT'] })).toBe(false);
    });
  });

  describe('shallow-only semantics (documented limitations)', () => {
    it('compares nested objects by reference, not structurally', () => {
      const shared = { nested: true };
      expect(shallowEqualIgnoringArrayOrder({ o: shared }, { o: shared })).toBe(true);
      // Equal-looking but distinct references are NOT considered equal.
      expect(shallowEqualIgnoringArrayOrder({ o: { nested: true } }, { o: { nested: true } })).toBe(
        false
      );
    });

    it('compares arrays as sets, so differing duplicate counts can still be "equal"', () => {
      // Same length and same distinct elements, but different multisets.
      // The Set-based comparison cannot tell these apart.
      expect(shallowEqualIgnoringArrayOrder({ m: [1, 1, 2] }, { m: [1, 2, 2] })).toBe(true);
    });
  });
});
