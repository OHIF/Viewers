import CustomizationService, { CustomizationType, MergeEnum } from './CustomizationService';
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
  customizationType: 'ohif.overlayItem',
  attribute: 'testAttribute',
  label: 'testItemLabel',
};

describe('CustomizationService.ts', () => {
  let customizationService;

  let configuration;

  beforeEach(() => {
    log.warn.mockClear();
    jest.clearAllMocks();
    configuration = {};
    customizationService = new CustomizationService({
      configuration,
      commandsManager,
    });
    extensionManager.registeredExtensionIds = [];
    extensionManager.moduleEntries = {};
  });

  describe('init', () => {
    it('init succeeds', () => {
      customizationService.init(extensionManager);
    });

    it('configurationRegistered', () => {
      configuration.testItem = testItem;
      customizationService.init(extensionManager);
      expect(customizationService.getGlobalCustomization('testItem')).toBe(testItem);
    });

    it('defaultRegistered', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [testItem],
      };
      customizationService.init(extensionManager);
      expect(customizationService.getGlobalCustomization('testItem')).toBe(testItem);
    });
  });

  describe('customizationType', () => {
    it('inherits type', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };
      configuration.testItem = testItem;
      customizationService.init(extensionManager);

      const item = customizationService.getGlobalCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('inline default inherits type', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };
      configuration.testItem = testItem;
      customizationService.init(extensionManager);

      const item = customizationService.getCustomization('testItem2', {
        id: 'testItem2',
        customizationType: 'ohif.overlayItem',
        label: 'otherLabel',
        attribute: 'otherAttr',
      });

      // Customizes the default value, as this is testItem2
      const props = { otherAttr: 'other attribute value' };
      const result = item.content(props);
      expect(result.label).toBe('otherLabel');
      expect(result.value).toBe(props.otherAttr);
      expect(result.ver).toBe('default');
    });
  });

  describe('mode customization', () => {
    it('onModeEnter can add extensions', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };
      customizationService.init(extensionManager);

      expect(customizationService.getModeCustomization('testItem')).toBeUndefined();

      customizationService.addModeCustomizations([testItem]);

      expect(customizationService.getGlobalCustomization('testItem')).toBeUndefined();

      const item = customizationService.getModeCustomization('testItem');
      expect(item).not.toBeUndefined();

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('global customizations override modes', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.global'] = {
        name: 'default',
        value: [ohifOverlayItem],
      };
      configuration.testItem = testItem;
      customizationService.init(extensionManager);

      // Add a mode customization that would otherwise fail below
      customizationService.addModeCustomizations([{ ...testItem, label: 'other' }]);

      const item = customizationService.getModeCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
    });

    it('mode customizations override default', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
        name: 'default',
        value: [ohifOverlayItem, testItem],
      };
      customizationService.init(extensionManager);

      // Add a mode customization that would otherwise fail below
      customizationService.addModeCustomizations([{ ...testItem, label: 'other' }]);

      const item = customizationService.getCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe('other');
      expect(result.value).toBe(props.testAttribute);
    });
  });

  describe('merge', () => {
    it('appends to global configuration', () => {
      customizationService.init(extensionManager);

      customizationService.setGlobalCustomization('appendSet', {
        values: [{ id: 'one' }, { id: 'two' }],
      });
      const appendSet = customizationService.getCustomization('appendSet');
      expect(appendSet.values.length).toBe(2);

      customizationService.setGlobalCustomization(
        'appendSet',
        {
          values: [{ id: 'three' }],
        },
        MergeEnum.Append
      );
      const appendSet2 = customizationService.getCustomization('appendSet');
      expect(appendSet2.values.length).toBe(3);
    });

    it('appends mode to default without touching default', () => {
      customizationService.init(extensionManager);

      customizationService.setDefaultCustomization('appendSet', {
        values: [{ id: 'one' }, { id: 'two' }],
      });
      const appendSet = customizationService.get('appendSet');
      expect(appendSet.values.length).toBe(2);

      customizationService.setModeCustomization(
        'appendSet',
        {
          values: [{ id: 'three' }],
        },
        MergeEnum.Append
      );

      expect(appendSet.values.length).toBe(2);
      const appendSet2 = customizationService.getModeCustomization('appendSet');
      expect(appendSet2.values.length).toBe(3);
    });

    it('merges values by name/position', () => {
      customizationService.init(extensionManager);

      customizationService.setDefaultCustomization('appendSet', {
        values: [{ id: 'one', obj: { v: '5' }, list: [1, 2, 3] }, { id: 'two' }],
      });
      const appendSet = customizationService.get('appendSet');
      expect(appendSet.values.length).toBe(2);

      customizationService.setModeCustomization(
        'appendSet',
        {
          values: [{ id: 'three', obj: { v: 2 }, list: [3, 2, 1, 4] }],
        },
        MergeEnum.Merge,
      );

      const appendSet2 = customizationService.get('appendSet');
      const [value0] = appendSet2.values;
      expect(value0.id).toBe('three');
      expect(value0.list).toEqual([3, 2, 1, 4]);
    });

    it('merges functions', () => {
      customizationService.init(extensionManager);

      customizationService.setDefaultCustomization('appendSet', {
        values: [{ f: () => 0, id: '0' }, { f: () => 5, id: '5' }],
      });
      const appendSet = customizationService.get('appendSet');
      expect(appendSet.values.length).toBe(2);

      customizationService.setModeCustomization(
        'appendSet',
        {
          values: [{ f: () => 2, id: '2' }]
        },
        MergeEnum.Merge,
      );

      const appendSet2 = customizationService.get('appendSet');
      const [value0, value1] = appendSet2.values;
      expect(value0.f()).toBe(2);
      expect(value1.f()).toBe(5);
    });

    it('merges list with object', () => {
      customizationService.init(extensionManager);

      const destination = [
        1,
        { id: 'two', value: 2, list: [5, 6], },
        { id: 'three', value: 3 }
      ];

      const source = {
        two: { value: 'updated2', list: { 0: 8 } },
        1: { extraValue: 2, list: [7], },
        1.0001: { id: 'inserted', value: 1.0001 },
        '-1': {
          value: -3
        },
      };

      customizationService.setDefaultCustomization('appendSet', {
        values: destination,
      });
      customizationService.setModeCustomization('appendSet', {
        values: source,
      }, MergeEnum.Append);

      const { values } = customizationService.getCustomization('appendSet');
      const [zero, one, two, three] = values;
      expect(zero).toBe(1);
      expect(one.value).toBe('updated2');
      expect(one.extraValue).toBe(2);
      expect(one.list).toEqual([8, 6, 7]);
      expect(two.id).toBe('inserted');
      expect(three.value).toBe(-3);
    });
  });
});
