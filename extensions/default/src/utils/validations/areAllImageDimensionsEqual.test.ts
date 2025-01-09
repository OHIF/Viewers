import areAllImageDimensionsEqual from './areAllImageDimensionsEqual';

describe('areAllImageDimensionsEqual', () => {
  it('should return false when no instances are provided', () => {
    expect(areAllImageDimensionsEqual([])).toBe(false);
    expect(areAllImageDimensionsEqual([] as any)).toBe(false);
  });

  it('should return true when all instances have the same dimensions', () => {
    const instances = [
      { Rows: '512', Columns: '512' },
      { Rows: '512', Columns: '512' },
      { Rows: '512', Columns: '512' }
    ];
    expect(areAllImageDimensionsEqual(instances)).toBe(true);
  });

  it('should return true when comparing string and number dimensions of same value', () => {
    const instances = [
      { Rows: 512, Columns: 512 },
      { Rows: '512', Columns: '512' }
    ];
    expect(areAllImageDimensionsEqual(instances)).toBe(true);
  });

  it('should return false when instances have different dimensions', () => {
    const instances = [
      { Rows: '512', Columns: '512' },
      { Rows: '256', Columns: '512' }
    ];
    expect(areAllImageDimensionsEqual(instances)).toBe(false);
  });

  it('should return false when dimensions are invalid strings', () => {
    const instances = [
      { Rows: '512', Columns: '512' },
      { Rows: 'invalid', Columns: '512' }
    ];
    expect(areAllImageDimensionsEqual(instances)).toBe(false);
  });
});
