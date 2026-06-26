import CustomizationService, { GENERAL_MODE_KEY } from './CustomizationService';

const commandsManager = {};

const policy = {
  prefixes: { default: './customizations/' },
};

/** Minimal ExtensionManager stub exposing the appConfig the URL policy reads. */
function makeExtensionManager(appConfig: Record<string, unknown> = {}) {
  return {
    appConfig: { customizationUrlPrefixes: policy.prefixes, ...appConfig },
    registeredExtensionIds: [],
    getRegisteredExtensionIds: () => [],
    getModuleEntry: () => undefined,
  } as any;
}

describe('CustomizationService phase-tagged loading', () => {
  it('applies preExtension before extensions and global after, both Global scope', async () => {
    const service = new CustomizationService({
      commandsManager,
      configuration: {
        preExtension: { early: { $set: 'pre' } },
        global: { late: { $set: 'post' } },
      },
    });

    const extensionManager = makeExtensionManager();
    await service.loadAndApplyPreExtensionCustomizations(extensionManager);

    // preExtension is applied immediately; global is not yet.
    expect(service.getCustomization('early')).toBe('pre');
    expect(service.getCustomization('late')).toBeUndefined();

    service.init(extensionManager);
    service.applyGlobalCustomizations();

    expect(service.getCustomization('late')).toBe('post');
    expect(service.getCustomizations(service.Scope.Global).get('early')).toBeDefined();
  });

  it('does not treat a phase-tagged config as legacy Global references', () => {
    const service = new CustomizationService({
      commandsManager,
      configuration: { global: { a: { $set: 1 } } },
    });
    service.init(makeExtensionManager());
    // `global` must NOT be added as a customization id during init; it is a phase.
    expect(service.getCustomization('global')).toBeUndefined();
    expect(service.getCustomization('a')).toBeUndefined();
  });

  it('applies the general mode block first, then the mode-specific block', () => {
    const service = new CustomizationService({
      commandsManager,
      configuration: {
        mode: {
          [GENERAL_MODE_KEY]: { greeting: { $set: 'general' }, shared: { $set: 'general' } },
          viewer: { greeting: { $set: 'viewer' } },
        },
      },
    });
    service.init(makeExtensionManager());

    service.onModeEnter();
    service.applyModeCustomizations(['viewer']);

    // mode-specific overrides general; non-overridden general value remains.
    expect(service.getCustomization('greeting')).toBe('viewer');
    expect(service.getCustomization('shared')).toBe('general');
  });

  it('matches a mode block by id OR routeName', () => {
    const service = new CustomizationService({
      commandsManager,
      configuration: {
        mode: { viewer: { fromRouteName: { $set: true } } },
      },
    });
    service.init(makeExtensionManager());

    service.onModeEnter();
    service.applyModeCustomizations(['@ohif/mode-longitudinal', 'viewer']);
    expect(service.getCustomization('fromRouteName')).toBe(true);
  });

  it('clears mode-scope customizations on re-enter so a different mode does not leak', () => {
    const service = new CustomizationService({
      commandsManager,
      configuration: {
        mode: {
          viewer: { onlyViewer: { $set: true } },
          segmentation: { onlySeg: { $set: true } },
        },
      },
    });
    service.init(makeExtensionManager());

    service.onModeEnter();
    service.applyModeCustomizations(['viewer']);
    expect(service.getCustomization('onlyViewer')).toBe(true);

    service.onModeEnter();
    service.applyModeCustomizations(['segmentation']);
    expect(service.getCustomization('onlyViewer')).toBeUndefined();
    expect(service.getCustomization('onlySeg')).toBe(true);
  });

  it('applies phase blocks from URL-loaded modules and merges $apply over extension defaults', async () => {
    const service = new CustomizationService({ commandsManager, configuration: {} });
    const extensionManager = makeExtensionManager();

    // Seed an extension-style default so $apply has something to build on.
    service.init(extensionManager);
    service.setCustomizations({ 'list.columns': ['a', 'b'] }, service.Scope.Default);

    const importFn = jest.fn(async () => ({
      global: { 'list.columns': { $push: ['c'] } },
      mode: { '*': { banner: { $set: 'all' } }, viewer: { banner: { $set: 'viewer' } } },
    }));

    await service.loadCustomizationModules(['A'], { policy, importFn });
    service.applyGlobalCustomizations();
    expect(service.getCustomization('list.columns')).toEqual(['a', 'b', 'c']);

    service.applyModeCustomizations(['viewer']);
    expect(service.getCustomization('banner')).toBe('viewer');
  });
});
