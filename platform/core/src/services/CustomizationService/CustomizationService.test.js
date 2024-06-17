import CustomizationService from './CustomizationService';
import log from '../../log';

jest.mock('../../log.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const extensionManager = {
  registeredExtensionIds: [],
  moduleEntries: {},

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

      const item = customizationService.getGlobalCustomization('testItem2', {
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

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('global customizations override modes', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries['@testExtension.customizationModule.default'] = {
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
  });
});
