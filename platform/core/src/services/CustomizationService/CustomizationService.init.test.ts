import CustomizationService from './CustomizationService';

const commandsManager = {};

describe('CustomizationService.init (extension default/global deduplication)', () => {
  it('does not re-merge the same extension customization modules on repeated init', () => {
    const getModuleEntry = jest.fn((id: string) => {
      if (id === 'ext1.customizationModule.default') {
        return { value: { fromDefault: { $set: 1 } } };
      }
      if (id === 'ext1.customizationModule.global') {
        return { value: { fromGlobal: { $set: 'g' } } };
      }
      return undefined;
    });

    const extensionManager = {
      registeredExtensionIds: ['ext1'],
      getRegisteredExtensionIds: () => ['ext1'],
      getModuleEntry,
    };

    const service = new CustomizationService({ commandsManager, configuration: {} });
    service.init(extensionManager as any);
    service.init(extensionManager as any);

    expect(getModuleEntry).toHaveBeenCalledTimes(2);
    expect(service.getCustomization('fromDefault')).toBe(1);
    expect(service.getCustomization('fromGlobal')).toBe('g');
  });

  it('merges a module the first time it appears on a later init', () => {
    const moduleEntries: Record<string, { value: Record<string, unknown> }> = {};

    const extensionManager = {
      registeredExtensionIds: ['ext2'],
      getRegisteredExtensionIds: () => ['ext2'],
      getModuleEntry: (id: string) => moduleEntries[id],
    };

    const service = new CustomizationService({ commandsManager, configuration: {} });
    service.init(extensionManager as any);
    expect(service.getCustomization('late')).toBeUndefined();

    moduleEntries['ext2.customizationModule.default'] = { value: { late: { $set: true } } };
    service.init(extensionManager as any);

    expect(service.getCustomization('late')).toBe(true);
  });
});
