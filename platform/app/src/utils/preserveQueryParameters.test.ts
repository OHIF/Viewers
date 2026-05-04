import { preserveQueryParameters, preserveQueryStrings } from './preserveQueryParameters';

describe('preserveQueryParameters', () => {
  it('preserves single-valued keys like configUrl', () => {
    const current = new URLSearchParams();
    current.append('configUrl', 'foo.js');
    const out = new URLSearchParams();
    preserveQueryParameters(out, current);
    expect(out.get('configUrl')).toBe('foo.js');
  });

  it('preserves all repeated values for the customization key', () => {
    const current = new URLSearchParams();
    current.append('customization', 'a');
    current.append('customization', 'b');
    const out = new URLSearchParams();
    preserveQueryParameters(out, current);
    expect(out.getAll('customization')).toEqual(['a', 'b']);
  });

  it('does not preserve unrelated keys', () => {
    const current = new URLSearchParams();
    current.append('foo', 'bar');
    const out = new URLSearchParams();
    preserveQueryParameters(out, current);
    expect(out.get('foo')).toBeNull();
  });
});

describe('preserveQueryStrings', () => {
  it('keeps single-valued keys flat and multi-valued keys as arrays', () => {
    const current = new URLSearchParams();
    current.append('configUrl', 'foo.js');
    current.append('customization', 'a');
    current.append('customization', 'b');

    const out: Record<string, string | string[]> = {};
    preserveQueryStrings(out, current);
    expect(out.configUrl).toBe('foo.js');
    expect(out.customization).toEqual(['a', 'b']);
  });

  it('uses a flat string when there is exactly one customization value', () => {
    const current = new URLSearchParams();
    current.append('customization', 'only');
    const out: Record<string, string | string[]> = {};
    preserveQueryStrings(out, current);
    expect(out.customization).toBe('only');
  });
});
