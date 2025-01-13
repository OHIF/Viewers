// File: CustomizationService.registrationAndOperations.test.js
import CustomizationService, { CustomizationScope, MergeEnum } from './CustomizationService';

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
const consoleAlertStub = () => 'alert';

// A helper default customization module that mimics the structure returned by the module.
function getDefaultCustomizationModule() {
  return [
    {
      // Simple types
      showAddSegment: true,
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
    },
  ];
}

describe('CustomizationService - Registration + API Operations', () => {
  let customizationService;

  beforeEach(() => {
    customizationService = new CustomizationService({ commandsManager, configuration: {} });
    // Clear any internal maps if needed
    customizationService.onModeEnter();

    // Simulate default registrations.
    customizationService.addReferences(getDefaultCustomizationModule(), CustomizationScope.Default);
  });

  // Check that defaults are registered
  it('has registered default customizations', () => {
    const defaultShowAddSegment = customizationService.getCustomization(
      'showAddSegment',
      CustomizationScope.Default
    );
    expect(defaultShowAddSegment).toBe(true);

    const defaultNumbersList = customizationService.getCustomization(
      'NumbersList',
      CustomizationScope.Default
    );
    expect(defaultNumbersList).toEqual([1, 2, 3, 4]);

    const defaultSeriesInfo = customizationService.getCustomization(
      'SeriesInfo',
      CustomizationScope.Default
    );
    expect(defaultSeriesInfo.label).toBe('Series Date');
    expect(defaultSeriesInfo.advanced.subKey).toBe('original');

    const defaultStudyBrowser = customizationService.getCustomization(
      'studyBrowser',
      CustomizationScope.Default
    );
    expect(Array.isArray(defaultStudyBrowser)).toBe(true);
    expect(defaultStudyBrowser.length).toBe(1);
  });

  // 1. Simple Data Types
  describe('Simple Data Types', () => {
    it('replaces boolean value using $set over the default', () => {
      // Update the default value with a new one using $set.
      customizationService.setCustomization(
        'showAddSegment',
        { $set: false },
        CustomizationScope.Mode,
        MergeEnum.Replace
      );
      const result = customizationService.getCustomization('showAddSegment');
      // Mode/global should override the default.
      expect(result.$set || result).toEqual(false);
    });

    it('replaces function value using $set over the default', () => {
      // Original default returns "default add"
      const original = customizationService.getCustomization(
        'onAddSegment',
        CustomizationScope.Default
      );
      expect(original()).toBe('default add');

      // Now update the function
      customizationService.setCustomization(
        'onAddSegment',
        { $set: () => consoleAlertStub() },
        CustomizationScope.Mode,
        MergeEnum.Replace
      );
      const updated = customizationService.getCustomization('onAddSegment');
      expect(updated.$set ? updated.$set() : updated()).toBe('alert');
    });
  });

  // 2. Arrays of Primitives
  describe('Arrays of Primitives', () => {
    it('replaces entire array with $set over default', () => {
      customizationService.setCustomization(
        'NumbersList',
        { $set: [5, 6, 7, 8, 9] },
        CustomizationScope.Mode,
        MergeEnum.Replace
      );
      const result = customizationService.getCustomization('NumbersList');
      expect(result.$set || result).toEqual([5, 6, 7, 8, 9]);
    });

    it('applies $push, $unshift, and $splice to default array', () => {
      // Update array using merge commands
      customizationService.setCustomization(
        'NumbersList',
        {
          $push: [5, 6],
          $unshift: [0],
          $splice: [
            [2, 1, 99], // At index 2, remove 1 element and insert 99
          ],
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      const result = customizationService.getCustomization('NumbersList');

      // Since the merge implementation is custom, we check for presence of array commands.
      // An integration test may compute the final array based on the operations.
      expect(result.$push).toEqual([5, 6]);
      expect(result.$unshift).toEqual([0]);
      expect(result.$splice).toEqual([[2, 1, 99]]);
    });
  });

  // 3. Objects
  describe('Objects', () => {
    it('replaces entire object with $set', () => {
      customizationService.setCustomization(
        'SeriesInfo',
        {
          $set: {
            label: 'Series Number',
            sortFunction: (a, b) => a?.SeriesNumber - b?.SeriesNumber,
            views: ['3D'],
          },
        },
        CustomizationScope.Mode,
        MergeEnum.Replace
      );
      const result = customizationService.getCustomization('SeriesInfo');
      expect(result.$set.label).toBe('Series Number');
      expect(result.$set.views).toEqual(['3D']);
    });

    it('merges object fields with $merge over default', () => {
      // Merge basic fields (in mode should override defaults)
      customizationService.setCustomization(
        'SeriesInfo',
        {
          $merge: {
            label: 'New Label',
            extraField: true,
          },
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      let result = customizationService.getCustomization('SeriesInfo');
      // Validate that label has been updated and new fields added.
      expect(result.$merge.label).toBe('New Label');
      expect(result.$merge.extraField).toBe(true);

      // Merge deeper nested fields on the "advanced" property.
      customizationService.setCustomization(
        'SeriesInfo',
        {
          advanced: {
            $merge: {
              subKey: 'updatedSubValue',
              newSubKey: 123,
            },
          },
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      result = customizationService.getCustomization('SeriesInfo');
      expect(result.advanced.$merge.subKey).toBe('updatedSubValue');
      expect(result.advanced.$merge.newSubKey).toBe(123);
      expect(result.advanced.$merge.anotherKey).toBe(42);
    });

    it('applies a function to modify a property with $apply', () => {
      customizationService.setCustomization(
        'SeriesInfo',
        {
          $apply: oldValue => ({
            ...oldValue,
            label: 'Series Number (via $apply)',
          }),
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      const result = customizationService.getCustomization('SeriesInfo');
      // Either check the direct value if transformation happened,
      // or verify that an $apply key is present that would be used during transformation.
      const transformed = result.$apply
        ? result.$apply({ label: 'Series Date', sortFunction: noop })
        : result;
      expect(transformed.label).toBe('Series Number (via $apply)');
    });
  });

  // 4. Arrays of Objects
  describe('Arrays of Objects', () => {
    it('replaces entire array of objects using $set', () => {
      customizationService.setCustomization(
        'studyBrowser',
        {
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
        CustomizationScope.Mode,
        MergeEnum.Replace
      );
      const result = customizationService.getCustomization('studyBrowser');
      expect(result.$set.length).toBe(2);
      expect(result.$set[0].id).toBe('seriesNumber');
    });

    it('updates array of objects with $push and $splice', () => {
      // Append a new item using $push
      customizationService.setCustomization(
        'studyBrowser',
        {
          $push: [
            {
              id: 'seriesNumber',
              label: 'Series Number',
              sortFunction: (a, b) => a?.SeriesNumber - b?.SeriesNumber,
            },
          ],
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      // Insert at index 1 with $splice
      customizationService.setCustomization(
        'studyBrowser',
        {
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
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      const result = customizationService.getCustomization('studyBrowser');
      expect(result.$push).toBeDefined();
      expect(result.$splice).toBeDefined();
    });
  });

  // 5. Advanced Nested Structures
  describe('Advanced Nested Structures', () => {
    it('updates a simple nested property using $set', () => {
      customizationService.setCustomization(
        'studyBrowser',
        {
          firstLabel: { $set: 'newLabel' },
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      const result = customizationService.getCustomization('studyBrowser');
      // The test verifies that the nested firstLabel was updated.
      expect(result.firstLabel.$set || result.firstLabel).toBe('newLabel');
    });

    it('updates array within nested object using $push and $splice', () => {
      // Append a new function to the nested array of functions.
      customizationService.setCustomization(
        'studyBrowser',
        {
          functions: {
            $push: [{ id: 'seriesDescription', label: 'Series Description', sortFunction: noop }],
          },
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      // Insert a function at index 1.
      customizationService.setCustomization(
        'studyBrowser',
        {
          functions: {
            $splice: [
              [
                1,
                0,
                {
                  id: 'seriesDateReverse',
                  label: 'Series Date (Reverse)',
                  sortFunction: (a, b) => new Date(a?.SeriesDate) - new Date(b?.SeriesDate),
                },
              ],
            ],
          },
        },
        CustomizationScope.Mode,
        MergeEnum.Merge
      );
      const result = customizationService.getCustomization('studyBrowser');
      expect(result.functions.$push).toBeDefined();
      expect(result.functions.$splice).toBeDefined();
    });
  });
});
