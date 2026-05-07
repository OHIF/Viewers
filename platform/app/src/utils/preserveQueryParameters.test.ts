import { preserveQueryParameters, preserveQueryStrings } from './preserveQueryParameters';

describe('preserveQueryParameters', () => {
  it('preserves base keys as query arrays', () => {
    const current = new URLSearchParams();
    current.append('configUrl', 'foo.js');
    const out = new URLSearchParams();
    preserveQueryParameters(out, undefined, current);
    expect(out.getAll('configUrl')).toEqual(['foo.js']);
  });

  it('preserves all repeated values for the customization key', () => {
    const current = new URLSearchParams();
    current.append('customization', 'a');
    current.append('customization', 'b');
    const out = new URLSearchParams();
    preserveQueryParameters(out, undefined, current);
    expect(out.getAll('customization')).toEqual(['a', 'b']);
  });

  it('does not preserve unrelated keys', () => {
    const current = new URLSearchParams();
    current.append('foo', 'bar');
    const out = new URLSearchParams();
    preserveQueryParameters(out, undefined, current);
    expect(out.get('foo')).toBeNull();
  });

  it('uses customization service values for multi-key preservation', () => {
    const customizationService = {
      getValue: jest.fn().mockReturnValue(['customization', 'customizationAlt']),
    };
    const current = new URLSearchParams();
    current.append('customizationAlt', 'c');
    const out = new URLSearchParams();
    preserveQueryParameters(out, customizationService, current);
    expect(out.getAll('customizationAlt')).toEqual(['c']);
    expect(customizationService.getValue).toHaveBeenCalled();
  });
});

describe('preserveQueryStrings', () => {
  it('keeps all preserved keys as arrays', () => {
    const current = new URLSearchParams();
    current.append('configUrl', 'foo.js');
    current.append('customization', 'a');
    current.append('customization', 'b');

    const out: Record<string, string | string[]> = {};
    preserveQueryStrings(out, undefined, current);
    expect(out.configUrl).toEqual(['foo.js']);
    expect(out.customization).toEqual(['a', 'b']);
  });

  it('keeps a single customization value as an array', () => {
    const current = new URLSearchParams();
    current.append('customization', 'only');
    const out: Record<string, string | string[]> = {};
    preserveQueryStrings(out, undefined, current);
    expect(out.customization).toEqual(['only']);
  });

  it('uses customization service values for query string preservation', () => {
    const customizationService = {
      getValue: jest.fn().mockReturnValue(['customization', 'customizationAlt']),
    };
    const current = new URLSearchParams();
    current.append('customizationAlt', 'c');
    const out: Record<string, string | string[]> = {};
    preserveQueryStrings(out, customizationService, current);
    expect(out.customizationAlt).toEqual(['c']);
    expect(customizationService.getValue).toHaveBeenCalled();
  });
});
