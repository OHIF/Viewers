import CustomizationService, { CustomizationScope, MergeEnum } from './CustomizationService';
import log from '../../log';

jest.mock('../../log.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const extensionManager = {
  registeredExtensionIds: [],
  moduleEntries: {},

  getRegisteredExtensionIds: () => extensionManager.registeredExtensionIds,

  getModuleEntry: function (id) {
    return this.moduleEntries[id];
  },
};

const commandsManager = {};

const ohifOverlayItem = {
  id: 'ohif.overlayItem',
  content: function (props) {
    return {
      label: this.label,
      value: props[this.attribute],
      ver: 'default',
    };
  },
};

const testItem = {
  id: 'testItem',
  inheritsFrom: 'ohif.overlayItem',
  attribute: 'testAttribute',
  label: 'testItemLabel',
};

const testItem2 = {
  id: 'testItem2',
  inheritsFrom: 'ohif.overlayItem',
  attribute: 'otherAttr',
  label: 'otherLabel',
};

describe('CustomizationService.js', () => {
  let customizationService;

  beforeEach(() => {
    log.warn.mockClear();
    jest.clearAllMocks();
    customizationService = new CustomizationService({
      commandsManager,
    });
    extensionManager.registeredExtensionIds = [];
    extensionManager.moduleEntries = {};
  });

  describe('init', () => {
    it('init succeeds without errors', () => {
      expect(() => customizationService.init(extensionManager)).not.toThrow();
    });

    it('registers default customizations from extensions', () => {
      // Add an extension with default customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [testItem],
      };

      customizationService.init(extensionManager);

      const retrieved = customizationService.getCustomization(
        'testItem',
        CustomizationScope.Default
      );
      expect(retrieved).toBe(testItem);
    });

    it('registers global customizations from extensions', () => {
      // Add an extension with global customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.global'] = {
        name: 'global',
        value: [testItem],
      };

      customizationService.init(extensionManager);

      const retrieved = customizationService.getCustomization(
        'testItem',
        CustomizationScope.Global
      );
      expect(retrieved).toBe(testItem);
    });
  });

  describe('mode customization', () => {
    it('onModeEnter can add mode-specific customizations', () => {
      // Register default customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };

      customizationService.init(extensionManager);

      expect(
        customizationService.getCustomization('testItem', CustomizationScope.Mode)
      ).toBeUndefined();

      // Add mode customization
      customizationService.setCustomization('testItem', testItem, CustomizationScope.Mode);

      const item = customizationService.getCustomization('testItem', CustomizationScope.Mode);
      expect(item).not.toBeUndefined();

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe('testItemLabel');
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('global customizations override mode customizations', () => {
      // Register global customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.global'] = {
        name: 'default',
        value: [testItem],
      };

      customizationService.init(extensionManager);

      // Add a mode customization that would otherwise be overridden by global
      customizationService.setCustomization(
        'testItem',
        { ...testItem, label: 'other' },
        CustomizationScope.Mode
      );

      // Retrieve without specifying scope, should get global
      const item = customizationService.getCustomization('testItem');

      expect(item.label).toBe('testItemLabel'); // From global
      expect(item.ver).toBeUndefined(); // No 'ver' in global
    });

    it('mode customizations override default customizations', () => {
      // Register default customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem, testItem],
      };

      customizationService.init(extensionManager);

      // Add a mode customization that overrides default
      customizationService.setCustomization(
        'testItem',
        { ...testItem, label: 'other' },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );

      const item = customizationService.getCustomization('testItem');
      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe('other'); // Overridden by mode
      expect(result.value).toBe(props.testAttribute);
    });
  });

  describe('merge strategies', () => {
    it('appends to global configuration', () => {
      customizationService.init(extensionManager);

      // Set global customization with initial values
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ id: 'one' }, { id: 'two' }],
        },
        CustomizationScope.Global
      );
      let appendSet = customizationService.getCustomization('appendSet', CustomizationScope.Global);

      expect(appendSet.values.length).toBe(2);

      // Append to global customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ id: 'three' }],
        },
        CustomizationScope.Global,
        MergeEnum.Append
      );
      appendSet = customizationService.getCustomization('appendSet', CustomizationScope.Global);
      expect(appendSet.values.length).toBe(3);
      expect(appendSet.values[2].id).toBe('three');
    });

    it('appends mode customizations without altering default', () => {
      customizationService.init(extensionManager);

      // Set default customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ id: 'one' }, { id: 'two' }],
        },
        CustomizationScope.Default,
        MergeEnum.Replace
      );
      const defaultAppendSet = customizationService.getCustomization(
        'appendSet',
        CustomizationScope.Default
      );
      expect(defaultAppendSet.values.length).toBe(2);

      // Append to mode customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ id: 'three' }],
        },
        CustomizationScope.Mode,
        MergeEnum.Append
      );
      const modeAppendSet = customizationService.getCustomization(
        'appendSet',
        CustomizationScope.Mode
      );
      expect(modeAppendSet.values.length).toBe(3);
      expect(modeAppendSet.values[2].id).toBe('three');

      // Ensure default remains unchanged
      expect(defaultAppendSet.values.length).toBe(2);
    });

    it('merges values by name/position', () => {
      customizationService.init(extensionManager);

      // Set default customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ id: 'one', obj: { v: '5' }, list: [1, 2, 3] }, { id: 'two' }],
        },
        CustomizationScope.Default,
        MergeEnum.Replace
      );
      const defaultAppendSet = customizationService.getCustomization(
        'appendSet',
        CustomizationScope.Default
      );
      expect(defaultAppendSet.values.length).toBe(2);

      // Merge mode customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ id: 'three', obj: { v: 2 }, list: [3, 2, 1, 4] }],
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );

      const mergedAppendSet = customizationService.getCustomization('appendSet');
      const value0 = mergedAppendSet.values[0];
      expect(value0.id).toBe('three');
      expect(value0.list).toEqual([3, 2, 1, 4]);
      expect(value0.obj.v).toBe(2);
    });

    it('merges functions correctly', () => {
      customizationService.init(extensionManager);

      // Set default customization with functions
      customizationService.setCustomization(
        'appendSet',
        {
          values: [
            { f: () => 0, id: '0' },
            { f: () => 5, id: '5' },
          ],
        },
        CustomizationScope.Default,
        MergeEnum.Replace
      );
      const defaultAppendSet = customizationService.getCustomization(
        'appendSet',
        CustomizationScope.Default
      );
      expect(defaultAppendSet.values.length).toBe(2);

      // Merge mode customization with functions
      customizationService.setCustomization(
        'appendSet',
        {
          values: [{ f: () => 2, id: '2' }],
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );

      const mergedAppendSet = customizationService.getCustomization('appendSet');
      const [value0, value1] = mergedAppendSet.values;
      expect(value0.f()).toBe(2); // Overridden by mode
      expect(value1.f()).toBe(5); // From default
    });

    it('merges list with object correctly', () => {
      customizationService.init(extensionManager);

      const destination = [1, { id: 'two', value: 2, list: [5, 6] }, { id: 'three', value: 3 }];

      const source = {
        two: { value: 'updated2', list: { 0: 8 } },
        1: { extraValue: 2, list: [7] },
        1.0001: { id: 'inserted', value: 1.0001 },
        '-1': { value: -3 },
      };

      // Set default customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: destination,
        },
        CustomizationScope.Default,
        MergeEnum.Replace
      );

      // Merge mode customization
      customizationService.setCustomization(
        'appendSet',
        {
          values: source,
        },
        CustomizationScope.Mode,
        MergeEnum.Append
      );

      const { values } = customizationService.getCustomization('appendSet');
      const [zero, one, two, three] = values;

      expect(zero).toBe(1);
      expect(one.value).toBe('updated2');
      expect(one.extraValue).toBe(2);
      expect(one.list).toEqual([8, 6, 7]);
      expect(two.id).toBe('inserted');
      expect(two.value).toBe(1.0001);
      expect(three.value).toBe(-3);
    });
  });

  describe('default customization modifications', () => {
    it('throws error when updating existing default customization', () => {
      customizationService.init(extensionManager);

      // Set default customization
      customizationService.setCustomization(
        'defaultItem',
        testItem,
        CustomizationScope.Default,
        MergeEnum.Replace
      );

      // Attempt to update the same default customization should throw
      expect(() => {
        customizationService.setCustomization(
          'defaultItem',
          { ...testItem, label: 'newLabel' },
          CustomizationScope.Default,
          MergeEnum.Replace
        );
      }).toThrowError('Trying to update existing default for customization defaultItem');
    });

    it('broadcasts DEFAULT_CUSTOMIZATION_MODIFIED event on default customization set', () => {
      customizationService.init(extensionManager);

      // Spy on the broadcastEvent method
      const broadcastSpy = jest.spyOn(customizationService, '_broadcastEvent');

      // Set default customization
      customizationService.setCustomization(
        'defaultItem',
        testItem,
        CustomizationScope.Default,
        MergeEnum.Replace
      );

      expect(broadcastSpy).toHaveBeenCalledWith(
        CustomizationService.EVENTS.DEFAULT_CUSTOMIZATION_MODIFIED,
        {
          buttons: customizationService.getCustomizations(CustomizationScope.Default),
          button: customizationService.getCustomization('defaultItem', CustomizationScope.Default),
        }
      );

      broadcastSpy.mockRestore();
    });
  });

  describe('customization inheritance', () => {
    it('inherits from default customization', () => {
      // Register default customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };

      customizationService.init(extensionManager);

      // Set global customization that inherits from default
      customizationService.setCustomization(
        'testItem',
        testItem,
        CustomizationScope.Global,
        MergeEnum.Merge
      );

      const item = customizationService.getCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe('testItemLabel');
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('inherits from default customization with inline default', () => {
      // Register default customization
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };

      customizationService.init(extensionManager);

      // Set a new customization that inherits from 'ohif.overlayItem'
      customizationService.setCustomization(
        'testItem2',
        testItem2,
        CustomizationScope.Global,
        MergeEnum.Merge
      );

      const item = customizationService.getCustomization('testItem2');

      const props = { otherAttr: 'other attribute value' };
      const result = item.content(props);
      expect(result.label).toBe('otherLabel');
      expect(result.value).toBe(props.otherAttr);
      expect(result.ver).toBe('default');
    });
  });
});
