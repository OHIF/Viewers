import formatValue from './formatValue';

describe('formatValue', () => {
  it('returns null for null or undefined', () => {
    expect(formatValue(null)).toBeNull();
    expect(formatValue(undefined)).toBeNull();
  });

  it('returns strings unchanged, including empty strings', () => {
    expect(formatValue('horse')).toBe('horse');
    expect(formatValue('')).toBe('');
  });

  it('extracts the Alphabetic component of a PersonName object', () => {
    expect(formatValue({ Alphabetic: 'Doe^John' })).toBe('Doe^John');
  });

  it('coerces numbers to strings, including zero', () => {
    expect(formatValue(0)).toBe('0');
    expect(formatValue(42)).toBe('42');
  });

  it('coerces booleans to strings', () => {
    expect(formatValue(true)).toBe('true');
    expect(formatValue(false)).toBe('false');
  });

  it('returns null for plain objects so they never render as [object Object]', () => {
    expect(formatValue({})).toBeNull();
    expect(formatValue({ foo: 'bar' })).toBeNull();
  });

  it('returns null for objects whose Alphabetic is not a string', () => {
    expect(formatValue({ Alphabetic: 123 })).toBeNull();
  });

  it('returns null for arrays', () => {
    expect(formatValue(['a', 'b'])).toBeNull();
  });
});
