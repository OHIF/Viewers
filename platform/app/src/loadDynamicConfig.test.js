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
});
