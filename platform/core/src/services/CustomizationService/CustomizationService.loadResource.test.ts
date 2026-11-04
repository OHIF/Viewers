import CustomizationService from './CustomizationService';

const commandsManager = {};

const prefixes = { default: 'https://viewer.example.com/customizations/' };

function makeExtensionManager(appConfig: Record<string, unknown> = {}) {
  return {
    appConfig: { customizationUrlPrefixes: prefixes, ...appConfig },
    registeredExtensionIds: [],
    getRegisteredExtensionIds: () => [],
    getModuleEntry: () => undefined,
  } as any;
}

function makeService(appConfig: Record<string, unknown> = {}, configuration = {}) {
  const service = new CustomizationService({ commandsManager, configuration });
  (service as any).extensionManager = makeExtensionManager(appConfig);
  return service;
}

function jsonResponse(text: string) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(text),
  };
}

describe('CustomizationService appConfig.loadResource', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;
  let logger: { warn: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    fetchMock = jest.fn(async (url: string) =>
      jsonResponse(`{ // JSONC\n global: { fetched: { $set: "${url}" } }, }`)
    );
    globalThis.fetch = fetchMock as any;
    logger = { warn: jest.fn(), error: jest.fn() };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('uses the data that the hook returns, and does not fetch', async () => {
    const loadResource = jest.fn(async () => ({ global: { fromHook: { $set: true } } }));
    const service = makeService({ loadResource });

    const loaded = await service.requires(['A'], { logger });

    expect(loadResource).toHaveBeenCalledWith({
      kind: 'customization',
      name: 'A',
      url: 'https://viewer.example.com/customizations/A.jsonc',
      defaultLoad: expect.any(Function),
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loaded).toHaveLength(1);
    expect(service.getCustomization('fromHook')).toBe(true);
  });

  it('accepts a module whose default export is the data', async () => {
    const service = makeService({
      loadResource: async () => ({ default: { global: { fromModule: { $set: 1 } } } }),
    });

    await service.requires(['A'], { logger });

    expect(service.getCustomization('fromModule')).toBe(1);
  });

  it('uses the regular load when the hook returns undefined', async () => {
    const loadResource = jest.fn(async () => undefined);
    const service = makeService({ loadResource });

    await service.requires(['A'], { logger });

    expect(loadResource).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://viewer.example.com/customizations/A.jsonc');
    expect(service.getCustomization('fetched')).toBe(
      'https://viewer.example.com/customizations/A.jsonc'
    );
  });

  it('lets the hook add headers through defaultLoad', async () => {
    const service = makeService({
      loadResource: ({ url, defaultLoad }) =>
        defaultLoad(url, { headers: { Authorization: 'Bearer abc' } }),
    });

    await service.requires(['A'], { logger });

    expect(fetchMock).toHaveBeenCalledWith('https://viewer.example.com/customizations/A.jsonc', {
      headers: { Authorization: 'Bearer abc' },
    });
    expect(service.getCustomization('fetched')).toBeDefined();
  });

  it('warns and skips the module when the hook throws, as for a failed regular load', async () => {
    const service = makeService({
      loadResource: () => {
        throw new Error('denied');
      },
    });

    const loaded = await service.requires(['A'], { logger });

    expect(loaded).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('failed to import customization "A"'),
      expect.any(Error)
    );
  });

  it('calls the hook for a nested requires', async () => {
    const loadResource = jest.fn(async ({ name }) =>
      name === 'A'
        ? { requires: ['B'], global: { a: { $set: 'A' } } }
        : { global: { b: { $set: 'B' } } }
    );
    const service = makeService({ loadResource });

    const loaded = await service.requires(['A'], { logger });

    expect(loadResource.mock.calls.map(([request]) => request.url)).toEqual([
      'https://viewer.example.com/customizations/A.jsonc',
      'https://viewer.example.com/customizations/B.jsonc',
    ]);
    expect(loaded.map(entry => entry.request.name)).toEqual(['B', 'A']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies the customizationUrlPrefixes policy before the hook', async () => {
    const loadResource = jest.fn();
    const service = makeService({ loadResource });

    await expect(service.requires(['/unknown/A'], { logger })).rejects.toThrow(
      /refusing to load customization/
    );
    expect(loadResource).not.toHaveBeenCalled();
  });

  it('calls the hook on the bootstrap path, before extensions register', async () => {
    const loadResource = jest.fn(async () => ({ bootstrap: { early: { $set: 'hook' } } }));
    const service = new CustomizationService({
      commandsManager,
      configuration: { requires: ['A'] },
    });

    await service.loadAndApplyBootstrapCustomizations(makeExtensionManager({ loadResource }));

    expect(loadResource).toHaveBeenCalledTimes(1);
    expect(service.getCustomization('early')).toBe('hook');
  });

  it('keeps the regular load when the app config has no hook', async () => {
    const service = makeService();

    await service.requires(['A'], { logger });

    expect(fetchMock).toHaveBeenCalledWith('https://viewer.example.com/customizations/A.jsonc');
    expect(service.getCustomization('fetched')).toBeDefined();
  });

  it('prefers an importFn override over the hook', async () => {
    const loadResource = jest.fn();
    const importFn = jest.fn(async () => ({ global: { fromOverride: { $set: true } } }));
    const service = makeService({ loadResource });

    await service.requires(['A'], { logger, importFn });

    expect(loadResource).not.toHaveBeenCalled();
    expect(service.getCustomization('fromOverride')).toBe(true);
  });
});
