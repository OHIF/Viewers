import { defaultDisplaySetSplitRules } from '@cornerstonejs/metadata';
import type { SplitRuleSet, SplitRuleSetEntry } from '@cornerstonejs/metadata';
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

/** An upstream default rule, with a test priority. */
const upstreamRule = (id: string, priority: number): SplitRuleSetEntry => {
  const entry = defaultDisplaySetSplitRules[id];
  if (!entry) {
    throw new Error(`upstream rule ${id} missing`);
  }
  return { ...entry, priority };
};

const testSplitRules: SplitRuleSet = {
  // One display set PER IMAGE for single-image modalities (CR here).
  singleImageModality: {
    priority: 1,
    viewportTypes: ['stack'],
    matches: instance => instance.Modality === 'CR' && !!instance.Rows,
    groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
  },
  mixedDimensionalityBValue: upstreamRule('mixedDimensionalityBValue', 2),
  volume3d: upstreamRule('volume3d', 3),
  defaultImageRule: upstreamRule('defaultImageRule', 4),
};

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
    displaySet.extendInstances = jest.fn(newInstances => {
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

    it('splits each series independently when a call mixes series', () => {
      // Series-level facts (and the reconciliation key) are per series, so a
      // mixed call must be partitioned rather than have series 1's facts
      // applied to series 2. Here only series-1 has mixed b-values.
      const mixed = makeMixedBValueSeries();
      const uniform = [1, 2, 3].map(() =>
        makeInstance({ SeriesInstanceUID: 'series-2', DiffusionBValue: 800 })
      );
      const added = service.makeDisplaySets([...mixed, ...uniform]);

      const bySeries = uid => added.filter(ds => ds.SeriesInstanceUID === uid);
      expect(bySeries('series-1')).toHaveLength(2);
      expect(bySeries('series-1').every(ds => ds.splitRuleId === 'mixedDimensionalityBValue')).toBe(
        true
      );
      // series-2 is uniform, so it must NOT inherit the mixed-b-value split.
      expect(bySeries('series-2')).toHaveLength(1);
      expect(bySeries('series-2')[0].splitRuleId).toBe('volume3d');
      expect(bySeries('series-2')[0].instances).toHaveLength(3);
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
      expect(withBValue.extendInstances).toHaveBeenCalledTimes(1);
      expect(withBValue.instances).toHaveLength(4);
      expect(invalidated).toHaveLength(1);
      expect(invalidated[0].displaySetInstanceUID).toBe(withBValue.displaySetInstanceUID);
    });

    it('keeps an existing display set when a later batch would regroup the series', () => {
      // Batch 1: uniform b-values - the volume3d rule groups the series.
      const withBValue = [
        makeInstance({ DiffusionBValue: 800 }),
        makeInstance({ DiffusionBValue: 800 }),
        makeInstance({ DiffusionBValue: 800 }),
      ];
      const [volume] = service.makeDisplaySets(withBValue);
      expect(volume.splitRuleId).toBe('volume3d');

      const removed = [];
      service.subscribe(EVENTS.DISPLAY_SETS_REMOVED, event => removed.push(event));

      // Batch 2: the full series now mixes defined/undefined b-values. A split
      // from the start would give two mixed-b-value display sets, but the
      // existing display set must not change: only the new instances are
      // placed, in a display set of their own.
      const withoutBValue = [makeInstance(), makeInstance(), makeInstance()];
      const secondAdded = service.makeDisplaySets([...withBValue, ...withoutBValue]);

      expect(removed).toHaveLength(0);
      expect(volume.instances).toEqual(withBValue);
      expect(volume.extendInstances).not.toHaveBeenCalled();
      expect(secondAdded).toHaveLength(1);
      expect(secondAdded[0].splitRuleId).toBe('mixedDimensionalityBValue');
      expect(secondAdded[0].instances).toEqual(withoutBValue);
      expect(service.getActiveDisplaySets()).toHaveLength(2);
    });

    it('adds a new instance to the display set that holds the rest of its group', () => {
      const withBValue = [
        makeInstance({ DiffusionBValue: 800 }),
        makeInstance({ DiffusionBValue: 800 }),
      ];
      const [volume] = service.makeDisplaySets(withBValue);
      const withoutBValue = [makeInstance(), makeInstance()];
      service.makeDisplaySets([...withBValue, ...withoutBValue]);

      // A new b-value instance groups with the first batch under the
      // mixed-b-value rule; those instances live in the volume3d display set.
      const extra = makeInstance({ DiffusionBValue: 800 });
      service.makeDisplaySets([...withBValue, ...withoutBValue, extra]);

      expect(volume.instances).toEqual([...withBValue, extra]);
      expect(service.getActiveDisplaySets()).toHaveLength(2);
    });

    it('keeps existing display sets when the rules change during a session', () => {
      const first = [1, 2, 3].map(() => makeInstance());
      const [volume] = service.makeDisplaySets(first);
      expect(volume.splitRuleId).toBe('volume3d');

      // A new rule that would claim every instance.
      setCustomization({
        enabled: true,
        splitRules: {
          ...testSplitRules,
          everything: { priority: -1, groupBy: ['SOPInstanceUID'] },
        },
        createDisplaySetFromGroup,
      });
      const extra = makeInstance();
      const added = service.makeDisplaySets([...first, extra]);

      expect(volume.instances).toEqual(first);
      expect(added.map(ds => [ds.splitRuleId, ds.instances])).toEqual([['everything', [extra]]]);
    });

    it('passes the series facts of the re-split to the display set it extends', () => {
      const factRule = {
        priority: 1,
        series: ({ instances }) => ({ count: instances.length }),
      };
      setCustomization({
        enabled: true,
        splitRules: { counted: factRule },
        createDisplaySetFromGroup,
      });
      const first = [makeInstance(), makeInstance()];
      const [displaySet] = service.makeDisplaySets(first);
      expect(createDisplaySetFromGroup.mock.calls[0][0].series).toEqual({ count: 2 });

      service.makeDisplaySets([...first, makeInstance()]);
      expect(displaySet.extendInstances.mock.calls[0][1].series).toEqual({ count: 3 });
    });

    /**
     * The SCOUT example, as the JSONC customization writes it: raw selector data
     * that the @cornerstonejs/metadata compiler turns into a rule. The series is
     * evaluated first (does it mix localizer and non-localizer images?), and
     * then each instance is matched with a simple test (is it a localizer?).
     */
    const scoutRule = {
      priority: -1,
      viewportTypes: ['stack'],
      series: [
        {
          name: 'hasScout',
          scope: 'mixed',
          when: { attribute: 'ImageType', contains: 'LOCALIZER' },
        },
      ],
      matches: {
        all: [{ seriesFact: 'hasScout' }, { attribute: 'ImageType', contains: 'LOCALIZER' }],
      },
      groupBy: ['SeriesInstanceUID'],
      customAttributes: {
        set: { label: 'SCOUT' },
        fromFirstInstance: { SeriesDescription: { expression: '`SCOUT ${SeriesDescription}`' } },
      },
    };
    const ct = (InstanceNumber: number, imageType: string[]) =>
      makeInstance({
        Modality: 'CT',
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.2',
        InstanceNumber,
        ImageType: imageType,
        SeriesDescription: 'CHEST',
      });
    const AXIAL = ['ORIGINAL', 'PRIMARY', 'AXIAL'];
    const LOCALIZER = ['ORIGINAL', 'PRIMARY', 'LOCALIZER'];

    it('splits a localizer off a CT series with a raw selector rule (SCOUT example)', () => {
      setCustomization({
        enabled: true,
        splitRules: { ...testSplitRules, ctScout: scoutRule },
        createDisplaySetFromGroup,
      });

      const ctInstances = [
        ct(1, LOCALIZER),
        ...Array.from({ length: 11 }, (_, i) => ct(i + 2, AXIAL)),
      ];
      const added = service.makeDisplaySets(ctInstances);

      expect(added).toHaveLength(2);
      const scout = added.find(ds => ds.splitRuleId === 'ctScout');
      const rest = added.find(ds => ds.splitRuleId === 'volume3d');
      expect(scout.instances.map(instance => instance.InstanceNumber)).toEqual([1]);
      expect(rest.instances).toHaveLength(11);

      // The compiled customAttributes produce the SCOUT labels.
      const compiledRule = createDisplaySetFromGroup.mock.calls.find(
        ([group]) => group.matchedRule.id === 'ctScout'
      )[0].matchedRule;
      const attributes = compiledRule.customAttributes(
        { instance: scout.instances[0] },
        { instances: scout.instances, splitNumber: 0 }
      );
      expect(attributes.label).toBe('SCOUT');
      expect(attributes.SeriesDescription).toBe('SCOUT CHEST');
    });

    it('leaves a series of localizers only, and a series with none, whole', () => {
      setCustomization({
        enabled: true,
        splitRules: { ...testSplitRules, ctScout: scoutRule },
        createDisplaySetFromGroup,
      });

      const localizersOnly = [1, 2, 3].map(n => ({
        ...ct(n, LOCALIZER),
        SeriesInstanceUID: 'loc',
      }));
      const noLocalizer = [1, 2, 3].map(n => ({ ...ct(n, AXIAL), SeriesInstanceUID: 'axial' }));
      const added = service.makeDisplaySets([...localizersOnly, ...noLocalizer]);

      expect(added.map(ds => [ds.SeriesInstanceUID, ds.splitRuleId, ds.instances.length])).toEqual([
        ['loc', 'volume3d', 3],
        ['axial', 'volume3d', 3],
      ]);
    });

    describe('keyed rule sets', () => {
      it('evaluates the rules in priority order', () => {
        setCustomization({
          enabled: true,
          splitRules: {
            ...testSplitRules,
            firstOnly: {
              priority: -1,
              matches: instance => instance.InstanceNumber === 1,
              groupBy: ['SOPInstanceUID'],
            },
          },
          createDisplaySetFromGroup,
        });
        const added = service.makeDisplaySets([1, 2, 3].map(() => makeInstance()));
        expect(added.map(ds => [ds.splitRuleId, ds.instances.length])).toEqual([
          ['firstOnly', 1],
          ['volume3d', 2],
        ]);
      });

      it('turns off a rule with a null priority', () => {
        setCustomization({
          enabled: true,
          splitRules: { ...testSplitRules, volume3d: { priority: null } },
          createDisplaySetFromGroup,
        });
        const [displaySet] = service.makeDisplaySets([1, 2, 3].map(() => makeInstance()));
        expect(displaySet.splitRuleId).toBe('defaultImageRule');
      });
    });

    it('gives the series to the legacy handlers when the split rules throw', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      setCustomization({
        enabled: true,
        splitRules: {
          throws: {
            priority: 1,
            matches: () => {
              throw new Error('bad rule');
            },
          },
        },
        createDisplaySetFromGroup,
      });
      const added = service.makeDisplaySets(makeMixedBValueSeries());
      expect(added).toHaveLength(1);
      expect(stackHandler.getDisplaySetsFromSeries).toHaveBeenCalledTimes(1);
      expect(stackHandler.getDisplaySetsFromSeries.mock.calls[0][0]).toHaveLength(6);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('split rules failed'),
        expect.any(Error)
      );
      warn.mockRestore();
    });

    it('passes the host comparator to the display set factory', () => {
      const compareInstances = jest.fn(() => 0);
      setCustomization({
        enabled: true,
        splitRules: testSplitRules,
        createDisplaySetFromGroup,
        compareInstances,
      });
      service.makeDisplaySets(makeMixedBValueSeries());
      expect(createDisplaySetFromGroup.mock.calls[0][1]).toEqual({
        splitNumber: 0,
        compareInstances,
      });
    });

    describe('runBy reconciliation', () => {
      // Singles and clips, split into runs. A clip that arrives late in the
      // middle of a run of singles splits that run.
      const us = (InstanceNumber: number, NumberOfFrames?: number) =>
        makeInstance({
          Modality: 'US',
          SOPInstanceUID: `us-${InstanceNumber}`,
          InstanceNumber,
          ...(NumberOfFrames ? { NumberOfFrames } : {}),
        });
      const runRule = {
        priority: 1,
        matches: instance => instance.Modality === 'US',
        runBy: instance => Number(instance.NumberOfFrames ?? 1) > 1,
      };

      beforeEach(() => {
        setCustomization({
          enabled: true,
          splitRules: { usRuns: runRule },
          createDisplaySetFromGroup,
        });
      });

      const uids = displaySet => displaySet.instances.map(instance => instance.SOPInstanceUID);
      const active = () =>
        service
          .getActiveDisplaySets()
          .map(uids)
          .sort((a, b) => a[0].localeCompare(b[0]));

      it('only adds display sets when a new run lands inside an existing run', () => {
        const first = [us(1), us(3), us(4, 60)];
        service.makeDisplaySets(first);
        expect(active()).toEqual([['us-1', 'us-3'], ['us-4']]);

        // us-2 is a clip. A split from the start gives [us-1] [us-2] [us-3]
        // [us-4], but the existing display sets must not change: us-2 gets a
        // display set of its own, and [us-1, us-3] keeps both singles.
        service.makeDisplaySets([...first, us(2, 45)]);

        // Each instance is in exactly one display set, and us-2 did not join
        // the display set of the unrelated clip us-4.
        expect(active()).toEqual([['us-1', 'us-3'], ['us-2'], ['us-4']]);
      });

      it('keeps the display set of a later run when a new run appears ahead of it', () => {
        const first = [us(1), us(3), us(4, 60)];
        const [, clip] = service.makeDisplaySets(first);
        service.makeDisplaySets([...first, us(2, 45)]);

        const clipNow = service
          .getActiveDisplaySets()
          .find(displaySet => uids(displaySet).includes('us-4'));
        expect(clipNow.displaySetInstanceUID).toBe(clip.displaySetInstanceUID);
      });

      it('does not remove instances that the call does not contain', () => {
        const [displaySet] = service.makeDisplaySets([us(1), us(2)]);
        // A caller that passes part of the series only.
        service.makeDisplaySets([us(1)]);
        expect(uids(displaySet)).toEqual(['us-1', 'us-2']);
      });
    });
  });
});
