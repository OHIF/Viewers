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
      customizations: { global: { entry: { value: url } } },
    }));
    const loaded = await service.requires(['A'], { policy, importFn });
    expect(loaded).toHaveLength(1);
    expect(loaded[0].request.name).toBe('A');
    expect(loaded[0].module.customizations).toBeDefined();
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('returns immediately when the same module is already loaded', async () => {
    const importFn = jest.fn(async (url: string) => ({
      customizations: { global: { entry: { value: url } } },
    }));
    await service.requires(['A'], { policy, importFn });
    expect(importFn).toHaveBeenCalledTimes(1);
    const loadedAgain = await service.requires(['A'], { policy, importFn });
    expect(loadedAgain).toHaveLength(0);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('loads dependencies first via module requires', async () => {
    const importFn = jest.fn(async (url: string) => {
      if (url.endsWith('/A.js')) {
        return {
          customizations: { global: { 'pkg.A': { value: 'A' } }, requires: ['B'] },
        };
      }
      if (url.endsWith('/B.js')) {
        return {
          customizations: { global: { 'pkg.B': { value: 'B' } } },
        };
      }
      return {};
    });

    const loaded = await service.requires(['A'], { policy, importFn });

    expect(loaded.map(l => l.request.name)).toEqual(['B', 'A']);
  });

  it('handles cycles per the spec: A requires B, B requires A => B then A', async () => {
    const importFn = jest.fn(async (url: string) => {
      if (url.endsWith('/A.js')) {
        return {
          customizations: { global: { 'pkg.A': { value: 'A' } }, requires: ['B'] },
        };
      }
      if (url.endsWith('/B.js')) {
        return {
          customizations: { global: { 'pkg.B': { value: 'B' } }, requires: ['A'] },
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
      customizations: {
        global: {
          'viewportOverlay.topLeft.X': { customization: 'ohif.overlayItem' },
        },
      },
    }));
    const loaded = await service.requires(['A'], { policy, importFn });
    expect(loaded).toHaveLength(1);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('parses comma-separated names like the URL query integration', async () => {
    const importFn = jest.fn(async () => ({
      customizations: { global: { 'pkg.X': {} } },
    }));
    const loaded = await service.requires(['A', 'B', '/default/C'], { policy, importFn });
    expect(loaded.map(l => l.request.name)).toEqual(['A', 'B', 'C']);
    expect(importFn).toHaveBeenCalledTimes(3);
  });

  it('logs warnings for rejected entries but still loads valid ones when not strict', async () => {
    const importFn = jest.fn(async () => ({
      customizations: { global: {} },
    }));
    const warn = jest.fn();
    const loaded = await service.requires(['A', '/missing/foo', '../escape'], {
      policy,
      importFn,
      logger: { warn, error: jest.fn() },
    });
    expect(loaded).toHaveLength(1);
    expect(loaded[0].request.name).toBe('A');
    expect(warn).toHaveBeenCalled();
  });

  it('throws in strict mode when any path is rejected as invalid', async () => {
    const importFn = jest.fn(async () => ({
      customizations: { global: {} },
    }));
    const outcome = await service
      .requires(['A', '/missing/foo'], {
        policy: { ...policy, strict: true },
        importFn,
        logger: { warn: jest.fn(), error: jest.fn() },
      })
      .catch(e => e);
    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toMatch(/strict mode/);
    expect(importFn).not.toHaveBeenCalled();
  });

  it('throws in strict mode when import fails', async () => {
    const importFn = jest.fn(async () => {
      throw new Error('404');
    });
    const outcome = await service
      .requires(['A'], {
        policy: { ...policy, strict: true },
        importFn,
        logger: { warn: jest.fn(), error: jest.fn() },
      })
      .catch(e => e);
    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toMatch(/failed to import/);
  });

  it('warns and skips when import fails if not strict', async () => {
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

  it('throws in strict mode when the module has no customization payload', async () => {
    const importFn = jest.fn(async () => ({}));
    const outcome = await service
      .requires(['A'], {
        policy: { ...policy, strict: true },
        importFn,
        logger: { warn: jest.fn(), error: jest.fn() },
      })
      .catch(e => e);
    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toMatch(/no customizations payload/);
  });

  it('applyCustomizationUrlSearchParams delegates to requires', async () => {
    const importFn = jest.fn(async () => ({
      customizations: { global: { 'pkg.X': {} } },
    }));
    const params = new URLSearchParams();
    params.append('customization', 'A,B');
    params.append('customization', '/default/C');
    await service.applyCustomizationUrlSearchParams(params, { policy, importFn });
    expect(importFn).toHaveBeenCalledTimes(3);
  });
});
