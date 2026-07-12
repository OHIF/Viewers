import { defaultDisplaySetSplitRules } from '@cornerstonejs/metadata';
import type { SplitRule } from '@cornerstonejs/metadata';
import DisplaySetService from './DisplaySetService';
import EVENTS from './EVENTS';
import * as displaySetStore from './displaySetStore';

const MR_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.4';
const CR_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.1';
const BASIC_TEXT_SR = '1.2.840.10008.5.1.4.1.1.88.11';

const STACK_HANDLER_ID = 'test-extension.sopClassHandlerModule.stack';
const SR_HANDLER_ID = 'test-extension.sopClassHandlerModule.sr';
const UNSUPPORTED_HANDLER_ID =
  '@ohif/extension-default.sopClassHandlerModule.not-supported-display-sets-handler';

let instanceCounter = 0;
const makeInstance = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: `sop-${++instanceCounter}`,
  SOPClassUID: MR_IMAGE_STORAGE,
  SeriesInstanceUID: 'series-1',
  StudyInstanceUID: 'study-1',
  Modality: 'MR',
  Rows: 128,
  Columns: 128,
  InstanceNumber: instanceCounter,
  ...overrides,
});

/** Mixed-b-value DWI fixture: half the instances carry DiffusionBValue. */
const makeMixedBValueSeries = () => [
  makeInstance({ DiffusionBValue: 800 }),
  makeInstance({ DiffusionBValue: 800 }),
  makeInstance({ DiffusionBValue: 800 }),
  makeInstance(),
  makeInstance(),
  makeInstance(),
];

/** One display set PER IMAGE for single-image modalities (CR here). */
const perImageRule: SplitRule = {
  id: 'singleImageModality',
  viewportTypes: ['stack'],
  matches: instance => instance.Modality === 'CR' && !!instance.Rows,
  groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
};

const upstreamRule = (id: string): SplitRule => {
  const rule = defaultDisplaySetSplitRules.find(candidate => candidate.id === id);
  if (!rule) {
    throw new Error(`upstream rule ${id} missing`);
  }
  return rule;
};

const testSplitRules: SplitRule[] = [
  perImageRule,
  upstreamRule('mixedDimensionalityBValue'),
  upstreamRule('volume3d'),
  upstreamRule('defaultImageRule'),
];

const makeCreateDisplaySetFromGroup = () => {
  let counter = 0;
  return jest.fn((group, { splitNumber }) => {
    const displaySet: any = {
      displaySetInstanceUID: `split-ds-${++counter}`,
      SeriesInstanceUID: group.instances[0].SeriesInstanceUID,
      StudyInstanceUID: group.instances[0].StudyInstanceUID,
      SOPClassHandlerId: STACK_HANDLER_ID,
      instances: [...group.instances],
      splitKey: group.splitKey,
      splitRuleId: group.matchedRule.id,
      splitNumber,
    };
    displaySet.updateInstances = jest.fn(newInstances => {
      displaySet.instances.push(...newInstances);
      return displaySet;
    });
    return displaySet;
  });
};

describe('DisplaySetService', () => {
  let service: DisplaySetService;
  let stackHandler;
  let srHandler;
  let unsupportedHandler;
  let customization;
  let legacyCounter = 0;

  const setCustomization = value => {
    customization = value;
  };

  beforeEach(() => {
    displaySetStore.clearDisplaySets();
    instanceCounter = 0;
    legacyCounter = 0;
    customization = undefined;

    stackHandler = {
      sopClassUids: [MR_IMAGE_STORAGE, CR_IMAGE_STORAGE],
      getDisplaySetsFromSeries: jest.fn(instances => [
        {
          displaySetInstanceUID: `legacy-ds-${++legacyCounter}`,
          SeriesInstanceUID: instances[0].SeriesInstanceUID,
          StudyInstanceUID: instances[0].StudyInstanceUID,
          SOPClassHandlerId: STACK_HANDLER_ID,
          instances: [...instances],
        },
      ]),
    };
    srHandler = {
      sopClassUids: [BASIC_TEXT_SR],
      getDisplaySetsFromSeries: jest.fn(instances => [
        {
          displaySetInstanceUID: `sr-ds-${++legacyCounter}`,
          SeriesInstanceUID: instances[0].SeriesInstanceUID,
          StudyInstanceUID: instances[0].StudyInstanceUID,
          SOPClassHandlerId: SR_HANDLER_ID,
          instances: [...instances],
        },
      ]),
    };
    unsupportedHandler = {
      sopClassUids: [],
      getDisplaySetsFromSeries: jest.fn(() => []),
    };

    const handlers = {
      [STACK_HANDLER_ID]: stackHandler,
      [SR_HANDLER_ID]: srHandler,
      [UNSUPPORTED_HANDLER_ID]: unsupportedHandler,
    };
    const extensionManager = { getModuleEntry: id => handlers[id] };
    const servicesManager = {
      services: {
        customizationService: {
          getCustomization: jest.fn(id =>
            id === 'useMetadataDisplaySet' ? customization : undefined
          ),
        },
      },
    };

    service = new DisplaySetService({ servicesManager } as any);
    service.init(extensionManager, [SR_HANDLER_ID, STACK_HANDLER_ID]);
  });

  afterEach(() => {
    service.onModeExit();
  });

  describe('legacy path (customization absent or disabled)', () => {
    it('dispatches all instances to the SOP class handlers', () => {
      const instances = makeMixedBValueSeries();
      const added = service.makeDisplaySets(instances);
      expect(stackHandler.getDisplaySetsFromSeries).toHaveBeenCalledTimes(1);
      expect(stackHandler.getDisplaySetsFromSeries.mock.calls[0][0]).toHaveLength(6);
      expect(added).toHaveLength(1);
      expect(service.getActiveDisplaySets()).toHaveLength(1);
    });

    it('behaves identically when the customization is disabled', () => {
      setCustomization({
        enabled: false,
        splitRules: testSplitRules,
        createDisplaySetFromGroup: makeCreateDisplaySetFromGroup(),
      });
      service.makeDisplaySets(makeMixedBValueSeries());
      expect(stackHandler.getDisplaySetsFromSeries).toHaveBeenCalledTimes(1);
    });

    it('stores display sets retrievable through the standard getters', () => {
      const [displaySet] = service.makeDisplaySets(makeMixedBValueSeries());
      expect(service.getDisplaySetByUID(displaySet.displaySetInstanceUID)).toBe(displaySet);
      expect(service.getDisplaySetsForSeries('series-1')).toEqual([displaySet]);
      const snapshot = service.getDisplaySetCache();
      expect(snapshot.get(displaySet.displaySetInstanceUID)).toBe(displaySet);
      // The snapshot is read-only: mutating it does not affect the service.
      snapshot.clear();
      expect(service.getDisplaySetByUID(displaySet.displaySetInstanceUID)).toBe(displaySet);
    });

    it('clears the store on onModeExit', () => {
      const [displaySet] = service.makeDisplaySets(makeMixedBValueSeries());
      service.onModeExit();
      expect(service.getDisplaySetByUID(displaySet.displaySetInstanceUID)).toBeUndefined();
      expect(service.getActiveDisplaySets()).toEqual([]);
    });
  });

  describe('metadata split rules (customization enabled)', () => {
    let createDisplaySetFromGroup;

    beforeEach(() => {
      createDisplaySetFromGroup = makeCreateDisplaySetFromGroup();
      setCustomization({
        enabled: true,
        splitRules: testSplitRules,
        createDisplaySetFromGroup,
      });
    });

    it('splits a mixed-b-value MR series into two display sets', () => {
      const added = service.makeDisplaySets(makeMixedBValueSeries());
      expect(added).toHaveLength(2);
      expect(added.every(ds => ds.splitRuleId === 'mixedDimensionalityBValue')).toBe(true);
      expect(new Set(added.map(ds => ds.splitKey)).size).toBe(2);
      expect(added[0].instances).toHaveLength(3);
      expect(added[1].instances).toHaveLength(3);
      expect(stackHandler.getDisplaySetsFromSeries).not.toHaveBeenCalled();
    });

    it('fires DISPLAY_SETS_ADDED once with both split display sets', () => {
      const addedEvents = [];
      service.subscribe(EVENTS.DISPLAY_SETS_ADDED, event => addedEvents.push(event));
      service.makeDisplaySets(makeMixedBValueSeries());
      expect(addedEvents).toHaveLength(1);
      expect(addedEvents[0].displaySetsAdded).toHaveLength(2);
    });

    it('creates one display set per image for single-image modalities', () => {
      const instances = [1, 2, 3, 4].map(() =>
        makeInstance({ Modality: 'CR', SOPClassUID: CR_IMAGE_STORAGE })
      );
      const added = service.makeDisplaySets(instances);
      expect(added).toHaveLength(4);
      expect(added.every(ds => ds.splitRuleId === 'singleImageModality')).toBe(true);
    });

    it('falls unmatched instances through to the legacy handlers', () => {
      const instances = [
        ...makeMixedBValueSeries(),
        makeInstance({ SOPClassUID: BASIC_TEXT_SR, Modality: 'SR', Rows: undefined }),
      ];
      const added = service.makeDisplaySets(instances);
      expect(added).toHaveLength(3);
      expect(srHandler.getDisplaySetsFromSeries).toHaveBeenCalledTimes(1);
      expect(srHandler.getDisplaySetsFromSeries.mock.calls[0][0]).toHaveLength(1);
      expect(srHandler.getDisplaySetsFromSeries.mock.calls[0][0][0].SOPClassUID).toBe(
        BASIC_TEXT_SR
      );
      expect(stackHandler.getDisplaySetsFromSeries).not.toHaveBeenCalled();
    });

    it('is idempotent for repeated calls with the same instances', () => {
      const instances = makeMixedBValueSeries();
      const added = service.makeDisplaySets(instances);
      expect(added).toHaveLength(2);
      const again = service.makeDisplaySets(instances);
      expect(again).toBeUndefined();
      expect(service.getActiveDisplaySets()).toHaveLength(2);
      expect(createDisplaySetFromGroup).toHaveBeenCalledTimes(2);
    });

    it('merges new instances into existing split display sets and invalidates', () => {
      const instances = makeMixedBValueSeries();
      const [added] = [service.makeDisplaySets(instances)];
      const invalidated = [];
      service.subscribe(EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED, event =>
        invalidated.push(event)
      );

      const extra = makeInstance({ DiffusionBValue: 800 });
      service.makeDisplaySets([...instances, extra]);

      expect(service.getActiveDisplaySets()).toHaveLength(2);
      const withBValue = added.find(ds =>
        ds.instances.some(instance => instance.DiffusionBValue !== undefined)
      );
      expect(withBValue.updateInstances).toHaveBeenCalledTimes(1);
      expect(withBValue.instances).toHaveLength(4);
      expect(invalidated).toHaveLength(1);
      expect(invalidated[0].displaySetInstanceUID).toBe(withBValue.displaySetInstanceUID);
    });

    it('removes stale display sets when a later batch regroups the series', () => {
      // Batch 1: uniform b-values - the volume3d rule groups the series.
      const withBValue = [
        makeInstance({ DiffusionBValue: 800 }),
        makeInstance({ DiffusionBValue: 800 }),
        makeInstance({ DiffusionBValue: 800 }),
      ];
      const firstAdded = service.makeDisplaySets(withBValue);
      expect(firstAdded).toHaveLength(1);
      expect(firstAdded[0].splitRuleId).toBe('volume3d');

      const removed = [];
      service.subscribe(EVENTS.DISPLAY_SETS_REMOVED, event => removed.push(event));

      // Batch 2: the full series now mixes defined/undefined b-values, so the
      // mixed-b-value rule wins and the volume3d grouping is stale.
      const fullSeries = [...withBValue, makeInstance(), makeInstance(), makeInstance()];
      const secondAdded = service.makeDisplaySets(fullSeries);

      expect(secondAdded).toHaveLength(2);
      expect(secondAdded.every(ds => ds.splitRuleId === 'mixedDimensionalityBValue')).toBe(true);
      expect(removed).toHaveLength(1);
      expect(removed[0].displaySetInstanceUIDs).toEqual([firstAdded[0].displaySetInstanceUID]);
      expect(service.getActiveDisplaySets()).toHaveLength(2);
      expect(
        service
          .getActiveDisplaySets()
          .some(ds => ds.displaySetInstanceUID === firstAdded[0].displaySetInstanceUID)
      ).toBe(false);
    });

    it('supports declarative rules with compiled expressions (SCOUT example)', () => {
      // Simulates a JSONC-authored rule after $function markers were compiled
      // by the CustomizationService read-time resolution.
      const { compileExpression } = require('../CustomizationService/expression');
      const scoutRule = {
        id: 'ctScout',
        viewportTypes: ['stack'],
        series: {
          frameCount: compileExpression(
            'sumOf(instances, defined(NumberOfFrames) ? NumberOfFrames : 1)'
          ),
          firstInstanceNumber: compileExpression('minOf(instances, InstanceNumber)'),
        },
        matches: compileExpression(
          "Modality === 'CT' && context.series.frameCount >= 10 && InstanceNumber == context.series.firstInstanceNumber"
        ),
        groupBy: ['SeriesInstanceUID'],
        customAttributes: {
          label: 'SCOUT',
          SeriesDescription: compileExpression('`SCOUT ${SeriesDescription}`'),
        },
      };
      setCustomization({
        enabled: true,
        splitRules: [scoutRule, ...testSplitRules],
        createDisplaySetFromGroup,
      });

      const ctInstances = Array.from({ length: 12 }, (_, i) =>
        makeInstance({
          Modality: 'CT',
          SOPClassUID: '1.2.840.10008.5.1.4.1.1.2',
          InstanceNumber: i + 1,
          SeriesDescription: 'CHEST',
        })
      );
      const added = service.makeDisplaySets(ctInstances);

      expect(added).toHaveLength(2);
      const scout = added.find(ds => ds.splitRuleId === 'ctScout');
      const rest = added.find(ds => ds.splitRuleId === 'volume3d');
      expect(scout.instances).toHaveLength(1);
      expect(scout.instances[0].InstanceNumber).toBe(1);
      expect(rest.instances).toHaveLength(11);

      // The normalized customAttributes produce the SCOUT labels.
      const normalizedRule = createDisplaySetFromGroup.mock.calls.find(
        ([group]) => group.matchedRule.id === 'ctScout'
      )[0].matchedRule;
      const attributes = normalizedRule.customAttributes(
        { instance: scout.instances[0] },
        { instances: scout.instances, splitNumber: 0 }
      );
      expect(attributes.label).toBe('SCOUT');
      expect(attributes.SeriesDescription).toBe('SCOUT CHEST');
    });

    it('does not split a small CT series with the SCOUT rule', () => {
      const { compileExpression } = require('../CustomizationService/expression');
      const scoutRule = {
        id: 'ctScout',
        viewportTypes: ['stack'],
        series: {
          frameCount: compileExpression(
            'sumOf(instances, defined(NumberOfFrames) ? NumberOfFrames : 1)'
          ),
          firstInstanceNumber: compileExpression('minOf(instances, InstanceNumber)'),
        },
        matches: compileExpression(
          "Modality === 'CT' && context.series.frameCount >= 10 && InstanceNumber == context.series.firstInstanceNumber"
        ),
        groupBy: ['SeriesInstanceUID'],
      };
      setCustomization({
        enabled: true,
        splitRules: [scoutRule, ...testSplitRules],
        createDisplaySetFromGroup,
      });

      const ctInstances = Array.from({ length: 5 }, (_, i) =>
        makeInstance({
          Modality: 'CT',
          SOPClassUID: '1.2.840.10008.5.1.4.1.1.2',
          InstanceNumber: i + 1,
        })
      );
      const added = service.makeDisplaySets(ctInstances);
      expect(added).toHaveLength(1);
      expect(added[0].splitRuleId).toBe('volume3d');
      expect(added[0].instances).toHaveLength(5);
    });
  });
});
