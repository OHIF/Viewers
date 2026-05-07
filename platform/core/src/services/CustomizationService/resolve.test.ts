import { resolveCustomizationUrl } from './resolve';
import type { ValidatedCustomization } from './validate';

const policy = {
  prefixes: {
    default: './customizations/',
    remote: 'https://customizations.example.com/ohifCustomizations',
    relative: '/customAssets/',
  },
};

function req(prefix: string, name: string): ValidatedCustomization {
  return {
    raw: name,
    normalized: `/${prefix}/${name}`,
    prefix,
    name,
  };
}

describe('CustomizationService URL resolve', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'https://viewer.example.com',
        search: '',
      },
    });
  });

  it('resolves /default/<name> against same-origin/base', () => {
    const url = resolveCustomizationUrl(req('default', 'veterinaryOverlay'), policy);
    expect(url.startsWith('https://viewer.example.com')).toBe(true);
    expect(url.endsWith('/customizations/veterinaryOverlay.js')).toBe(true);
  });

  it('resolves an absolute trusted prefix to its remote URL', () => {
    const url = resolveCustomizationUrl(req('remote', 'veterinaryOverlay'), policy);
    expect(url).toBe(
      'https://customizations.example.com/ohifCustomizations/veterinaryOverlay.js'
    );
  });

  it('resolves a relative absolute-path prefix against same origin', () => {
    const url = resolveCustomizationUrl(req('relative', 'foo'), policy);
    expect(url).toBe('https://viewer.example.com/customAssets/foo.js');
  });

  it('throws on unknown prefix', () => {
    expect(() => resolveCustomizationUrl(req('missing', 'x'), policy)).toThrow();
  });

  it('throws when the name contains traversal', () => {
    expect(() =>
      resolveCustomizationUrl(req('default', '../escape'), policy)
    ).toThrow(/traversal/);
  });

  it('accepts names that already include .js suffix', () => {
    const url = resolveCustomizationUrl(req('default', 'veterinary.js'), policy);
    expect(url.endsWith('/customizations/veterinary.js')).toBe(true);
  });
});
