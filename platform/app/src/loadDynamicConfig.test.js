import loadDynamicConfig from './loadDynamicConfig';

describe('loadDynamicConfig', () => {
  let errorSpy;
  const setConfigUrl = url =>
    window.history.replaceState({}, '', `/?configUrl=${encodeURIComponent(url)}`);

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ fetched: true }) });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  test('enabled without regex refuses and logs', async () => {
    setConfigUrl('https://evil.example.com/c.json');
    const result = await loadDynamicConfig({ dangerouslyUseDynamicConfig: { enabled: true } });
    expect(result).toBe(null);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('Refusing to load ?configUrl=');
  });

  test('whitespace-only regex is not an explicit regex', async () => {
    // ' ' passed the old `regex.length > 0` check and then matched any URL
    // containing a space.
    setConfigUrl('https://evil.example.com/c.json');
    const result = await loadDynamicConfig({
      dangerouslyUseDynamicConfig: { enabled: true, regex: '  ' },
    });
    expect(result).toBe(null);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain('neither "origins" nor "regex"');
  });

  test('enabled with matching RegExp fetches', async () => {
    setConfigUrl('https://good.example.com/c.json');
    const result = await loadDynamicConfig({
      dangerouslyUseDynamicConfig: { enabled: true, regex: /^https:\/\/good\.example\.com\// },
    });
    expect(global.fetch).toHaveBeenCalledWith('https://good.example.com/c.json');
    expect(result).toEqual({ fetched: true });
  });

  test('enabled with non-matching regex returns null without fetching', async () => {
    setConfigUrl('https://evil.example.com/c.json');
    const result = await loadDynamicConfig({
      dangerouslyUseDynamicConfig: { enabled: true, regex: /^https:\/\/good\.example\.com\// },
    });
    expect(result).toBe(null);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('string regex (JSON-sourced) is accepted as explicit', async () => {
    setConfigUrl('https://good.example.com/c.json');
    const result = await loadDynamicConfig({
      dangerouslyUseDynamicConfig: { enabled: true, regex: '^https://good\\.example\\.com/' },
    });
    expect(result).toEqual({ fetched: true });
  });

  test('disabled returns null', async () => {
    setConfigUrl('https://good.example.com/c.json');
    expect(await loadDynamicConfig({})).toBe(null);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('enabled but no configUrl returns null', async () => {
    expect(
      await loadDynamicConfig({ dangerouslyUseDynamicConfig: { enabled: true, regex: /.*/ } })
    ).toBe(null);
  });

  describe('unanchored patterns', () => {
    // The finding: `regex: 'config\\.example\\.com'` reads like a host
    // allowlist but matching is unanchored, so a hostile URL satisfies it from
    // its own query string — and a hostile config document can set
    // runtimeExtensionOrigins + extensions[] descriptors.
    test('an unanchored pattern is refused loudly instead of matching mid-URL', async () => {
      setConfigUrl('https://evil.example.com/c.json?x=config.example.com');
      const result = await loadDynamicConfig({
        dangerouslyUseDynamicConfig: { enabled: true, regex: 'config\\.example\\.com' },
      });
      expect(result).toBe(null);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain('is not anchored');
    });

    test('/.*/ is refused; /^/ is the anchored way to accept everything', async () => {
      setConfigUrl('https://evil.example.com/c.json');
      expect(
        await loadDynamicConfig({ dangerouslyUseDynamicConfig: { enabled: true, regex: /.*/ } })
      ).toBe(null);
      expect(global.fetch).not.toHaveBeenCalled();

      expect(
        await loadDynamicConfig({ dangerouslyUseDynamicConfig: { enabled: true, regex: /^/ } })
      ).toEqual({ fetched: true });
    });

    test('the "m" flag cannot be used to defeat the anchor', async () => {
      setConfigUrl('https://good.example.com/c.json');
      const result = await loadDynamicConfig({
        dangerouslyUseDynamicConfig: {
          enabled: true,
          regex: /^https:\/\/good\.example\.com\//m,
        },
      });
      expect(result).toBe(null);
      expect(errorSpy.mock.calls[0][0]).toContain('"m" flag');
    });
  });

  describe('origins allowlist', () => {
    test('a matching origin fetches without any regex', async () => {
      setConfigUrl('https://good.example.com/deep/c.json');
      const result = await loadDynamicConfig({
        dangerouslyUseDynamicConfig: {
          enabled: true,
          // Full-URL entry: only its origin is used for the comparison.
          origins: ['https://good.example.com/configs/'],
        },
      });
      expect(result).toEqual({ fetched: true });
    });

    test('a non-matching origin is refused even when the regex would match', async () => {
      setConfigUrl('https://evil.example.com/c.json');
      const result = await loadDynamicConfig({
        dangerouslyUseDynamicConfig: {
          enabled: true,
          origins: ['https://good.example.com'],
          regex: /^https:/,
        },
      });
      expect(result).toBe(null);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('is not listed in');
    });

    test('a different port is a different origin', async () => {
      setConfigUrl('https://good.example.com:8443/c.json');
      expect(
        await loadDynamicConfig({
          dangerouslyUseDynamicConfig: { enabled: true, origins: ['https://good.example.com'] },
        })
      ).toBe(null);
    });

    test('malformed allowlist entries are skipped, not fatal', async () => {
      setConfigUrl('https://good.example.com/c.json');
      expect(
        await loadDynamicConfig({
          dangerouslyUseDynamicConfig: {
            enabled: true,
            origins: ['%%%', 'https://good.example.com'],
          },
        })
      ).toEqual({ fetched: true });
    });
  });

  describe('URL resolution', () => {
    test('non-http(s) schemes are refused', async () => {
      setConfigUrl('javascript:alert(1)');
      const result = await loadDynamicConfig({
        dangerouslyUseDynamicConfig: { enabled: true, regex: /^/ },
      });
      expect(result).toBe(null);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('scheme is not allowed');
    });

    test('the pattern and the fetch both see the RESOLVED absolute URL', async () => {
      // A protocol-relative value passes a naive `startsWith('/')` check but
      // resolves cross-origin; an anchored same-origin pattern must reject it.
      setConfigUrl('//evil.example.com/c.json');
      expect(
        await loadDynamicConfig({
          dangerouslyUseDynamicConfig: { enabled: true, regex: '^http://localhost/' },
        })
      ).toBe(null);
      expect(global.fetch).not.toHaveBeenCalled();

      // A relative path is matched (and fetched) as the absolute URL the
      // browser would actually request.
      setConfigUrl('config/example.json');
      expect(
        await loadDynamicConfig({
          dangerouslyUseDynamicConfig: { enabled: true, regex: '^http://localhost/config/' },
        })
      ).toEqual({ fetched: true });
      expect(global.fetch).toHaveBeenCalledWith('http://localhost/config/example.json');
    });
  });
});
