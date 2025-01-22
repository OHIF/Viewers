// File: CustomizationService.registrationAndOperations.test.js
import CustomizationService, { CustomizationScope } from './CustomizationService';

const commandsManager = {};
const extensionManager = {
  registeredExtensionIds: [],
  moduleEntries: {},
  getRegisteredExtensionIds: () => extensionManager.registeredExtensionIds,
  getModuleEntry: function (id) {
    return this.moduleEntries[id];
  },
};

const noop = () => {};

// A helper default customization module that mimics the structure returned by the module.
function getDefaultCustomizationModule() {
  return {
    // Simple types
    showAddSegment: true,
    somethingFalse: false,
    onAddSegment: () => 'default add',
    // Array of primitives
    NumbersList: [1, 2, 3, 4],
    // Object
    SeriesInfo: {
      label: 'Series Date',
      sortFunction: noop,
      views: ['sagittal', 'coronal', 'axial'],
      advanced: {
        subKey: 'original',
        anotherKey: 42,
      },
    },
    // Array of objects
    studyBrowser: [
      {
        id: 'seriesDate',
        label: 'Series Date',
        sortFunction: noop,
      },
    ],
    advanced: {
      firstLabel: 'hello',
      functions: [
        {
          id: 'seriesDate',
          label: 'Series Date',
          sortFunction: () => {},
          viewFunctions: [
            { id: 'sagittal', label: 'Sagittal', sortFunction: () => {} },
            { id: 'coronal', label: 'Coronal', sortFunction: () => {} },
            { id: 'axial', label: 'Axial', sortFunction: () => {} },
          ],
        },
      ],
    },
  };
}

describe('CustomizationService - Registration + API Operations', () => {
  let customizationService;

  beforeEach(() => {
    customizationService = new CustomizationService({ commandsManager, configuration: {} });

    // Simulate default registrations.
    customizationService.addReferences(getDefaultCustomizationModule(), CustomizationScope.Default);
  });

  afterEach(() => {
    customizationService.onModeExit();
  });

  // Check that defaults are registered
  it('has registered default customizations', () => {
    const defaultShowAddSegment = customizationService.getCustomization('showAddSegment');
    expect(defaultShowAddSegment).toBe(true);

    const defaultNumbersList = customizationService.getCustomization('NumbersList');
    expect(defaultNumbersList).toEqual([1, 2, 3, 4]);

    const defaultSeriesInfo = customizationService.getCustomization('SeriesInfo');
    expect(defaultSeriesInfo.label).toBe('Series Date');
    expect(defaultSeriesInfo.advanced.subKey).toBe('original');

    const defaultStudyBrowser = customizationService.getCustomization('studyBrowser');
    expect(Array.isArray(defaultStudyBrowser)).toBe(true);
    expect(defaultStudyBrowser.length).toBe(1);

    //
    const advanced = customizationService.getCustomization('advanced');
    expect(advanced.firstLabel).toBe('hello');
    expect(advanced.functions.length).toBe(1);
    expect(advanced.functions[0].id).toBe('seriesDate');
    expect(advanced.functions[0].viewFunctions.length).toBe(3);
    expect(advanced.functions[0].viewFunctions[0].id).toBe('sagittal');
    expect(advanced.functions[0].viewFunctions[1].id).toBe('coronal');
    expect(advanced.functions[0].viewFunctions[2].id).toBe('axial');
  });

  // 1. Simple Data Types
  describe('Simple Data Types', () => {
    it('replaces boolean value using $set over the default', () => {
      // Update the default value with a new one using $set.
      customizationService.setCustomizations({
        showAddSegment: { $set: false },
      });
      const result = customizationService.getCustomization('showAddSegment');

      // Mode/global should override the default.
      expect(result).toBe(false);
    });

    it('replaces boolean value using $set over the default false', () => {
      // Update the default value with a new one using $set.
      customizationService.setCustomizations({
        somethingFalse: { $set: true },
      });
      const result = customizationService.getCustomization('somethingFalse');

      // Mode/global should override the default.
      expect(result).toBe(true);
    });

    it('replaces function value using $set over the default', () => {
      // Original default returns "default add"
      const original = customizationService.getCustomization('onAddSegment');
      expect(original()).toBe('default add');

      // Now update the function
      customizationService.setCustomizations({
        onAddSegment: { $set: () => 999 },
      });
      const updated = customizationService.getCustomization('onAddSegment');
      expect(updated()).toBe(999);
    });

    it('replaces two properties at once', () => {
      // Original default returns "default add"
      const original = customizationService.getCustomization('onAddSegment');
      expect(original()).toBe('default add');

      // Now update the function
      customizationService.setCustomizations({
        onAddSegment: { $set: () => 998 },
        showAddSegment: { $set: false },
      });
      expect(customizationService.getCustomization('onAddSegment')).toBeDefined();
      expect(customizationService.getCustomization('showAddSegment')).toBe(false);
      expect(customizationService.getCustomization('onAddSegment')()).toBe(998);
    });
  });

  // 2. Arrays of Primitives
  describe('Arrays of Primitives', () => {
    it('replaces entire array with $set over default', () => {
      customizationService.setCustomizations({
        NumbersList: { $set: [5, 6, 7, 8, 9] },
      });
      const result = customizationService.getCustomization('NumbersList');
      expect(result).toEqual([5, 6, 7, 8, 9]);
    });

    it('applies $push, $unshift, and $splice to default array', () => {
      // Update array using merge commands
      customizationService.setCustomizations({
        NumbersList: {
          $push: [5, 6],
        },
      });
      const result = customizationService.getCustomization('NumbersList');
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('applies $push, $unshift, and $splice to default array', () => {
      // Update array using merge commands
      customizationService.setCustomizations({
        NumbersList: {
          $unshift: [0],
        },
      });
      const result = customizationService.getCustomization('NumbersList');
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('applies $push, $unshift, and $splice to default array', () => {
      // Update array using merge commands
      customizationService.setCustomizations({
        NumbersList: {
          $splice: [
            [2, 1, 99], // At index 2, remove
          ],
        },
      });
      const result = customizationService.getCustomization('NumbersList');
      expect(result).toEqual([1, 2, 99, 4]);
    });

    it('applies $push, $unshift, and $splice to default array', () => {
      // Update array using merge commands
      customizationService.setCustomizations({
        NumbersList: {
          $push: [5, 6],
          $unshift: [0],
        },
      });
      const result = customizationService.getCustomization('NumbersList');

      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  // 3. Objects
  describe('Objects', () => {
    it('replaces entire object with $set', () => {
      customizationService.setCustomizations({
        SeriesInfo: {
          $set: {
            label: 'Series Number',
            sortFunction: (a, b) => a?.SeriesNumber - b?.SeriesNumber,
            views: ['3D'],
          },
        },
      });
      const result = customizationService.getCustomization('SeriesInfo');

      expect(result.label).toBe('Series Number');
      expect(result.sortFunction).not.toEqual(noop);
      expect(result.views).toEqual(['3D']);
    });

    it('merges object fields with $merge over default', () => {
      // Merge basic fields (in mode should override defaults)
      customizationService.setCustomizations({
        SeriesInfo: {
          $merge: {
            label: 'New Label',
            extraField: true,
          },
        },
      });
      let result = customizationService.getCustomization('SeriesInfo');

      expect(result.label).toBe('New Label');
      expect(result.extraField).toBe(true);

      // Merge deeper nested fields on the "advanced" property.
      customizationService.setCustomizations({
        SeriesInfo: {
          advanced: {
            $merge: {
              subKey: 'updatedSubValue',
              newSubKey: 123,
            },
          },
        },
      });
      result = customizationService.getCustomization('SeriesInfo');
      expect(result.advanced.subKey).toBe('updatedSubValue');
      expect(result.advanced.newSubKey).toBe(123);
      expect(result.advanced.anotherKey).toBe(42);
    });

    it('applies a function to modify a property with $apply', () => {
      customizationService.setCustomizations({
        SeriesInfo: {
          $apply: oldValue => ({
            ...oldValue,
            label: 'Series Number (via $apply)',
          }),
        },
      });
      const result = customizationService.getCustomization('SeriesInfo');

      expect(result.label).toBe('Series Number (via $apply)');
    });
  });

  // 4. Arrays of Objects
  describe('Arrays of Objects', () => {
    it('replaces entire array of objects using $set', () => {
      customizationService.setCustomizations({
        studyBrowser: {
          $set: [
            {
              id: 'seriesNumber',
              label: 'Series Number',
              sortFunction: (a, b) => a?.SeriesNumber - b?.SeriesNumber,
            },
            {
              id: 'seriesDate',
              label: 'Series Date',
              sortFunction: (a, b) => new Date(b?.SeriesDate) - new Date(a?.SeriesDate),
            },
          ],
        },
      });
      const result = customizationService.getCustomization('studyBrowser');
      expect(result.length).toBe(2);
      expect(result[0].label).toBe('Series Number');
      expect(result[1].label).toBe('Series Date');
    });

    it('updates array of objects with $push and $splice', () => {
      // Append a new item using $push
      customizationService.setCustomizations({
        studyBrowser: {
          $push: [
            {
              id: 'seriesNumber',
              label: 'Series Number',
              sortFunction: (a, b) => a?.SeriesNumber - b?.SeriesNumber,
            },
          ],
        },
      });

      let result = customizationService.getCustomization('studyBrowser');
      expect(result.length).toBe(2);
      expect(result[0].label).toBe('Series Date');
      expect(result[1].label).toBe('Series Number');

      // Insert at index 1 with $splice
      customizationService.setCustomizations({
        studyBrowser: {
          $splice: [
            [
              1,
              0,
              {
                id: 'anotherItem',
                label: 'Another Item',
                sortFunction: noop,
              },
            ],
          ],
        },
      });
      result = customizationService.getCustomization('studyBrowser');
      expect(result.length).toBe(3);
      expect(result[0].label).toBe('Series Date');
      expect(result[1].label).toBe('Another Item');
    });
  });

  // 5. Advanced Nested Structures
  describe('Advanced Nested Structures', () => {
    it('updates first level properties in advanced object', () => {
      customizationService.setCustomizations({
        advanced: {
          firstLabel: {
            $set: 'newLabel',
          },
        },
      });

      const result = customizationService.getCustomization('advanced');
      expect(result.firstLabel).toBe('newLabel');
      expect(result.functions).toBeDefined();
    });

    it('updates nested objects within functions array using $filter and $merge', () => {
      customizationService.setCustomizations({
        advanced: {
          // filter an object that is inside the advanced object
          // and then merge the object
          $filter: {
            match: { id: 'seriesDate' },
            $merge: {
              label: 'Series Data (via $filter)',
            },
          },
        },
      });

      const result = customizationService.getCustomization('advanced');

      expect(result.functions.length).toBe(1);
      expect(result.functions[0].label).toBe('Series Data (via $filter)');
    });

    it('updates deeply nested view functions using $filter', () => {
      customizationService.setCustomizations({
        advanced: {
          $filter: {
            match: { id: 'axial' },
            $merge: {
              label: 'Axial (via $filter)',
            },
          },
        },
      });

      const result = customizationService.getCustomization('advanced');

      expect(result.functions.length).toBe(1);
      expect(result.functions[0].viewFunctions[2].label).toBe('Axial (via $filter)');
    });
  });

  // 6. Multiple Default Registrations
  describe('Multiple Default Registrations', () => {
    it('allows subsequent default registrations to enhance previous ones', () => {
      customizationService = new CustomizationService({ commandsManager, configuration: {} });

      // First extension registers its defaults
      const firstExtensionDefaults = {
        simpleList: [1, 2, 3],
      };
      customizationService.addReferences(firstExtensionDefaults, CustomizationScope.Default);

      // Second extension enhances the first one's defaults
      const secondExtensionDefaults = {
        simpleList: { $push: [4, 5] },
      };
      customizationService.addReferences(secondExtensionDefaults, CustomizationScope.Default);

      // Verify the final state combines both extensions' contributions
      const result = customizationService.getCustomization('simpleList');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('CustomizationService - Inheritance (`inheritsFrom`)', () => {
    it('inherits properties from the parent customization', () => {
      // Register a parent customization
      customizationService.setCustomizations(
        {
          'test.overlayItem': {
            label: 'Default Label',
            color: 'blue',
          },
        },
        CustomizationScope.Default
      );

      // Register a child customization with `inheritsFrom`
      customizationService.setCustomizations({
        'viewportOverlay.topLeft.StudyDate': {
          $set: {
            inheritsFrom: 'test.overlayItem',
            label: 'Study Date',
            title: ' date',
          },
        },
      });

      const customization = customizationService.getCustomization(
        'viewportOverlay.topLeft.StudyDate'
      );

      // Check that the inherited and overridden properties exist
      expect(customization.label).toBe('Study Date'); // Overridden
      expect(customization.color).toBe('blue'); // Inherited
    });

    it('executes transform methods from the parent customization', () => {
      // Register a parent customization
      customizationService.setCustomizations(
        {
          'test.overlayItem': {
            $set: {
              $transform: function () {
                return {
                  label: this.label,
                  additionalKey: 'transformedValue',
                };
              },
            },
          },
        },
        CustomizationScope.Default
      );

      // Register a child customization with `inheritsFrom`
      customizationService.setCustomizations({
        'viewportOverlay.bottomRight.InstanceNumber': {
          $set: {
            inheritsFrom: 'test.overlayItem',
            label: 'Instance Number',
            title: 'Instance Title',
          },
        },
      });

      const customization = customizationService.getCustomization(
        'viewportOverlay.bottomRight.InstanceNumber'
      );

      // Verify that the transform function from the parent is executed
      expect(customization.additionalKey).toBe('transformedValue');
      expect(customization.label).toBe('Instance Number');
      expect(customization.title).toBe(undefined);
    });
  });
});
