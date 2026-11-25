import CustomizationService from './CustomizationService';

const commandsManager = {};

const policy = {
  prefixes: { default: './customizations/' },
};

describe('CustomizationService.requires (URL customization modules)', () => {
  let service: CustomizationService;

  beforeEach(() => {
    service = new CustomizationService({ commandsManager, configuration: {} });
  });

  it('loads a single module', async () => {
    const importFn = jest.fn(async (url: string) => ({
      global: { entry: { value: url } },
    }));
    const loaded = await service.requires(['A'], { policy, importFn });
    expect(loaded).toHaveLength(1);
    expect(loaded[0].request.name).toBe('A');
    expect(loaded[0].module.global).toBeDefined();
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('returns immediately when the same module is already loaded', async () => {
    const importFn = jest.fn(async (url: string) => ({
      global: { entry: { value: url } },
    }));
    await service.requires(['A'], { policy, importFn });
    expect(importFn).toHaveBeenCalledTimes(1);
    const loadedAgain = await service.requires(['A'], { policy, importFn });
    expect(loadedAgain).toHaveLength(0);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('loads dependencies first via module requires', async () => {
    const importFn = jest.fn(async (url: string) => {
      if (url.endsWith('/A.jsonc')) {
        return {
          global: { 'pkg.A': { value: 'A' } },
          requires: ['B'],
        };
      }
      if (url.endsWith('/B.jsonc')) {
        return {
          global: { 'pkg.B': { value: 'B' } },
        };
      }
      return {};
    });

    const loaded = await service.requires(['A'], { policy, importFn });

    expect(loaded.map(l => l.request.name)).toEqual(['B', 'A']);
  });

  it('handles cycles per the spec: A requires B, B requires A => B then A', async () => {
    const importFn = jest.fn(async (url: string) => {
      if (url.endsWith('/A.jsonc')) {
        return {
          global: { 'pkg.A': { value: 'A' } },
          requires: ['B'],
        };
      }
      if (url.endsWith('/B.jsonc')) {
        return {
          global: { 'pkg.B': { value: 'B' } },
          requires: ['A'],
        };
      }
      return {};
    });

    const loaded = await service.requires(['A'], { policy, importFn });

    expect(loaded.map(l => l.request.name)).toEqual(['B', 'A']);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('does not treat customization field refs as URL dependencies', async () => {
    const importFn = jest.fn(async () => ({
      global: {
        'viewportOverlay.topLeft.X': { customization: 'ohif.overlayItem' },
      },
    }));
    const loaded = await service.requires(['A'], { policy, importFn });
    expect(loaded).toHaveLength(1);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('parses comma-separated names like the URL query integration', async () => {
    const importFn = jest.fn(async () => ({
      global: { 'pkg.X': {} },
    }));
    const loaded = await service.requires(['A', 'B', 'C'], { policy, importFn });
    expect(loaded.map(l => l.request.name)).toEqual(['A', 'B', 'C']);
    expect(importFn).toHaveBeenCalledTimes(3);
  });

  it('throws and loads nothing when any entry is rejected', async () => {
    const importFn = jest.fn(async () => ({
      global: {},
    }));
    await expect(
      service.requires(['A', '/missing/foo', '../escape'], { policy, importFn })
    ).rejects.toThrow(/refusing to load customization/);
    expect(importFn).not.toHaveBeenCalled();
  });

  it('warns and skips when import fails', async () => {
    const importFn = jest.fn(async () => {
      throw new Error('404');
    });
    const warn = jest.fn();
    const loaded = await service.requires(['A'], {
      policy,
      importFn,
      logger: { warn, error: jest.fn() },
    });
    expect(loaded).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });

  it('warns and skips when the module has no customization payload', async () => {
    const importFn = jest.fn(async () => ({}));
    const warn = jest.fn();
    const loaded = await service.requires(['A'], {
      policy,
      importFn,
      logger: { warn, error: jest.fn() },
    });
    expect(loaded).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });

  it('applyCustomizationUrlSearchParams delegates to requires', async () => {
    const importFn = jest.fn(async () => ({
      global: { 'pkg.X': {} },
    }));
    const params = new URLSearchParams();
    params.append('customization', 'A,B');
    params.append('customization', 'C');
    await service.applyCustomizationUrlSearchParams(params, { policy, importFn });
    expect(importFn).toHaveBeenCalledTimes(3);
  });
});
