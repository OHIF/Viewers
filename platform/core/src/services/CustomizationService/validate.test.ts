import {
  parseCustomizationParams,
  normalizeCustomizationValue,
  validateCustomizationRequests,
} from './validate';
import { customizationUrlDefaults } from './customizationUrlDefaults';

describe('CustomizationService URL validate', () => {
  describe('parseCustomizationParams', () => {
    it('returns repeated and comma-delimited values flattened', () => {
      const params = new URLSearchParams();
      params.append('customization', 'a,b');
      params.append('customization', 'c');
      expect(parseCustomizationParams(params)).toEqual(['a', 'b', 'c']);
    });

    it('matches the parameter key case-insensitively', () => {
      const params = new URLSearchParams();
      params.append('Customization', 'foo');
      params.append('CUSTOMIZATION', 'bar');
      expect(parseCustomizationParams(params)).toEqual(['foo', 'bar']);
    });

    it('skips empty pieces and trims whitespace', () => {
      const params = new URLSearchParams();
      params.append('customization', ' a , , b ');
      expect(parseCustomizationParams(params)).toEqual(['a', 'b']);
    });
  });

  describe('normalizeCustomizationValue', () => {
    it('prepends /default/ for path-relative values', () => {
      expect(normalizeCustomizationValue('veterinaryOverlay')).toBe(
        '/default/veterinaryOverlay'
      );
    });

    it('preserves explicit /prefix/name forms', () => {
      expect(normalizeCustomizationValue('/remote/foo')).toBe('/remote/foo');
    });

    it('returns null when there is no name part', () => {
      expect(normalizeCustomizationValue('/onlyPrefix')).toBeNull();
      expect(normalizeCustomizationValue('')).toBeNull();
    });
  });

  describe('validateCustomizationRequests', () => {
    const policy = {
      ...customizationUrlDefaults,
      prefixes: {
        default: './customizations/',
        remote: 'https://customizations.example.com/ohifCustomizations',
      },
    };

    it('accepts default-prefixed names', () => {
      const result = validateCustomizationRequests(['veterinary'], policy);
      expect(result.rejected).toEqual([]);
      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].normalized).toBe('/default/veterinary');
      expect(result.valid[0].prefix).toBe('default');
      expect(result.valid[0].name).toBe('veterinary');
    });

    it('accepts arbitrary logical names under a configured prefix', () => {
      const result = validateCustomizationRequests(['siteTheme2026'], policy);
      expect(result.rejected).toEqual([]);
      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe('siteTheme2026');
    });

    it('accepts remote-prefixed names', () => {
      const result = validateCustomizationRequests(['/remote/veterinaryOverlay'], policy);
      expect(result.rejected).toEqual([]);
      expect(result.valid[0].prefix).toBe('remote');
      expect(result.valid[0].name).toBe('veterinaryOverlay');
    });

    it('rejects values with .. traversal', () => {
      const result = validateCustomizationRequests(['../etc/passwd'], policy);
      expect(result.valid).toEqual([]);
      expect(result.rejected[0].reason).toMatch(/traversal/);
    });

    it('rejects full URLs', () => {
      const result = validateCustomizationRequests(
        ['http://evil.example.com/x', 'https://evil/x', '//evil/x'],
        policy
      );
      expect(result.valid).toEqual([]);
      expect(result.rejected).toHaveLength(3);
      for (const r of result.rejected) {
        expect(r.reason).toMatch(/full URLs/);
      }
    });

    it('rejects unknown prefixes', () => {
      const result = validateCustomizationRequests(['/missing/x'], policy);
      expect(result.valid).toEqual([]);
      expect(result.rejected[0].reason).toMatch(/unknown prefix/);
    });

    it('rejects unsafe name segments', () => {
      const result = validateCustomizationRequests(['/default/foo/./bar'], policy);
      expect(result.valid).toEqual([]);
      expect(result.rejected[0].reason).toMatch(/unsafe/);
    });
  });
});
