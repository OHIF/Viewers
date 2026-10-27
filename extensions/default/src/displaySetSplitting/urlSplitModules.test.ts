import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';
import { newContext } from 'immutability-helper';
import {
  createDisplaySetSplitRules,
  defaultMetadataContext,
  displaySetRules,
  groupInstancesBySplitRules,
} from '@cornerstonejs/metadata';
import { CustomizationService } from '@ohif/core';
import getMetadataDisplaySetCustomization from '../customizations/metadataDisplaySetCustomization';
import getMetadataContextCustomization from '../customizations/metadataContextCustomization';

/**
 * The `split/*.jsonc` URL modules in platform/app/public are data that no
 * build step checks. These tests apply each module as a server does: with
 * `JSON5`, the standard `immutability-helper` commands and the
 * `@cornerstonejs/metadata` defaults, and with no OHIF code.
 */
const SPLIT_DIR = path.resolve(__dirname, '../../../../platform/app/public/customizations/split');

const readModule = (name: string) =>
  JSON5.parse(fs.readFileSync(path.join(SPLIT_DIR, `${name}.jsonc`), 'utf8'));

const MODULE_NAMES = fs
  .readdirSync(SPLIT_DIR)
  .filter(file => file.endsWith('.jsonc'))
  .map(file => file.replace(/\.jsonc$/, ''));

/** `immutability-helper` with the standard commands only: no OHIF `$filter`. */
const standardUpdate = newContext();

/**
 * The customizations a server gets for one module: the CS3D defaults, then
 * the `global` block of each required module, then of the module itself.
 */
const serverCustomizations = (name: string) => {
  let value = {
    useMetadataDisplaySet: { enabled: false, splitRules: displaySetRules },
    metadataContext: defaultMetadataContext,
  };
  const applied = new Set<string>();
  const apply = (moduleName: string) => {
    if (applied.has(moduleName)) {
      return;
    }
    applied.add(moduleName);
    const module = readModule(moduleName);
    (module.requires ?? []).forEach(required => apply(required.replace(/^split\//, '')));
    value = standardUpdate(value, module.global ?? {});
  };
  apply(name);
  return value;
};

/** The split rules of one module, compiled as a server compiles them. */
const compileModule = (name: string, overlay = {}) => {
  const { useMetadataDisplaySet, metadataContext } = serverCustomizations(name);
  return createDisplaySetSplitRules(standardUpdate(useMetadataDisplaySet.splitRules, overlay), {
    context: metadataContext,
  });
};

/** The `useMetadataDisplaySet` value that OHIF gets for one module. */
const ohifSplitCustomization = async (name: string) => {
  const service = new CustomizationService({ configuration: {}, commandsManager: {} } as never);
  service.setCustomizations(
    {
      ...getMetadataDisplaySetCustomization({} as never),
      ...getMetadataContextCustomization(),
    },
    service.Scope.Default
  );
  await service.requires([`split/${name}`], {
    policy: { prefixes: { default: './customizations/' } },
    importFn: async (url: string) => readModule(url.match(/split\/(\w+)\.jsonc$/)[1]),
  });
  return service.getCustomization('useMetadataDisplaySet') as {
    enabled: boolean;
    splitRules: unknown;
  };
};

const MR_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.4';

let counter = 0;
const mr = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: `sop-${++counter}`,
  SeriesInstanceUID: 'series-1',
  StudyInstanceUID: 'study-1',
  SeriesDescription: 'DWI',
  Modality: 'MR',
  SOPClassUID: MR_IMAGE_STORAGE,
  Rows: 128,
  Columns: 128,
  InstanceNumber: counter,
  ...overrides,
});

const CT_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.2';
const ct = (z: number, InstanceNumber: number) => ({
  ...mr(),
  Modality: 'CT',
  SeriesDescription: 'AX',
  SOPClassUID: CT_IMAGE_STORAGE,
  InstanceNumber,
  ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
  ImagePositionPatient: [0, 0, z],
});

const rows = groups =>
  groups.map(group => [group.matchedRule.id, group.instances.map(i => i.InstanceNumber)]);

describe('split URL modules', () => {
  beforeEach(() => {
    counter = 0;
  });

  // DS-USER-PARITY-1, DS-USER-PARITY-2 (DS-IMPL-OHIF-8).
  it.each(MODULE_NAMES)(
    '%s gives a server and OHIF the same split rules, with no OHIF code on the server',
    async name => {
      const server = serverCustomizations(name).useMetadataDisplaySet;
      const ohif = await ohifSplitCustomization(name);

      expect(ohif.enabled).toBe(server.enabled);
      expect(ohif.splitRules).toEqual(server.splitRules);
      expect(() => compileModule(name)).not.toThrow();
    }
  );

  it('dwiByBValue makes one display set for each b-value', () => {
    const rules = compileModule('dwiByBValue');
    const series = [
      ...[1, 2, 3].map(() => mr({ DiffusionBValue: 0 })),
      ...[1, 2, 3].map(() => mr({ DiffusionBValue: 1000 })),
      ...[1, 2, 3].map(() => mr({ DiffusionBValue: 500 })),
    ];
    const groups = groupInstancesBySplitRules(series as any, rules);

    expect(groups.map(group => group.matchedRule.id)).toEqual([
      'dwiByBValue',
      'dwiByBValue',
      'dwiByBValue',
    ]);
    // The natural order of the keys puts the groups in b-value order.
    expect(groups.map(group => group.instances.map(i => i.DiffusionBValue)[0])).toEqual([
      0, 500, 1000,
    ]);
    expect(groups.every(group => group.instances.length === 3)).toBe(true);
  });

  it('dwiByBValue leaves the frames without a b-value to mixedDimensionalityBValue', () => {
    const rules = compileModule('dwiByBValue');
    const series = [...[1, 2].map(() => mr({ DiffusionBValue: 800 })), ...[1, 2].map(() => mr())];
    const groups = groupInstancesBySplitRules(series as any, rules);

    expect(groups.map(group => [group.matchedRule.id, group.instances.length])).toEqual([
      ['dwiByBValue', 2],
      ['mixedDimensionalityBValue', 2],
    ]);
  });

  it('dwiByBValue leaves a series of b=0 frames only to the default rules', () => {
    const rules = compileModule('dwiByBValue');
    const series = [1, 2, 3].map(() => mr({ SeriesDescription: 'T2W', DiffusionBValue: 0 }));
    const groups = groupInstancesBySplitRules(series as any, rules);

    expect(groups.map(group => [group.matchedRule.id, group.instances.length])).toEqual([
      ['volume3d', 3],
    ]);
  });

  describe('single images', () => {
    const SOP_CLASS = {
      DX: '1.2.840.10008.5.1.4.1.1.1.1',
      CR: '1.2.840.10008.5.1.4.1.1.1',
      MG: '1.2.840.10008.5.1.4.1.1.1.2',
    };
    const image = (Modality: 'DX' | 'CR' | 'MG', size = 128) => ({
      ...mr(),
      SeriesDescription: Modality,
      Modality,
      SOPClassUID: SOP_CLASS[Modality],
      Rows: size,
      Columns: size,
    });
    const split = (moduleName: string, images) =>
      groupInstancesBySplitRules(images as any, compileModule(moduleName)).map(group => [
        group.matchedRule.id,
        group.instances.length,
      ]);

    // DS-USER-SPLIT: a four-view MG series gives four display sets, as before #6137.
    it.each(['MG', 'DX', 'CR'] as const)(
      'the default rules make one display set for each image of a %s series',
      modality => {
        expect(
          split(
            'enableNewSplit',
            [1, 2, 3, 4].map(() => image(modality))
          )
        ).toEqual(Array.from({ length: 4 }, () => ['singleImageModality', 1]));
      }
    );

    // DS-USER-SPLIT-1.
    it('singleImagesBySize makes one display set for each image size', () => {
      const images = [image('DX', 128), image('DX', 1024), image('DX', 128)];
      expect(split('singleImagesBySize', images)).toEqual([
        ['singleImagesBySize', 2],
        ['singleImagesBySize', 1],
      ]);
    });
  });

  // DS-USER-SPLIT-2.
  describe('decimation', () => {
    const series = () => [0, 2, 4, 6, 8].map((z, index) => ct(z, index + 1));

    it('splits a series into ceil(count / decimationSize) parts, by sliceIndex modulo the count', () => {
      const rules = compileModule('decimation', {
        decimation: { context: { decimationSize: { $set: 2 } } },
      });
      expect(rows(groupInstancesBySplitRules(series() as any, rules))).toEqual([
        ['decimation', [1, 4]],
        ['decimation', [2, 5]],
        ['decimation', [3]],
      ]);
    });

    it('leaves a series of decimationSize (1000) images or fewer to the default rules', () => {
      expect(
        rows(groupInstancesBySplitRules(series() as any, compileModule('decimation')))
      ).toEqual([['volume3d', [1, 2, 3, 4, 5]]]);
    });
  });

  describe('series context modules', () => {
    const US_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.6.1';

    it('regularVolume makes a volume of the regular slices, and leaves the extra slice', () => {
      // Slices every 2 mm, and one extra slice at 3.1 mm.
      const series = [ct(0, 1), ct(2, 2), ct(4, 3), ct(6, 4), ct(3.1, 5)];

      expect(
        rows(groupInstancesBySplitRules(series as any, compileModule('regularVolume')))
      ).toEqual([
        ['regularVolume', [1, 2, 3, 4]],
        ['volume3d', [5]],
      ]);
    });

    it('regularVolume keeps a fully regular series as the default volume', () => {
      const series = [ct(0, 1), ct(2, 2), ct(4, 3)];

      expect(
        rows(groupInstancesBySplitRules(series as any, compileModule('regularVolume')))
      ).toEqual([['volume3d', [1, 2, 3]]]);
    });

    it('volumeProjectionOrder orders the slices by position, not by InstanceNumber', () => {
      const series = [ct(4, 1), ct(0, 2), ct(2, 3)];

      expect(
        rows(groupInstancesBySplitRules(series as any, compileModule('volumeProjectionOrder')))
      ).toEqual([['volume3d', [2, 3, 1]]]);
    });

    it('usTimeClusters makes one display set for each sweep, in time order', () => {
      const us = (AcquisitionTime: string, InstanceNumber: number) => ({
        ...mr(),
        Modality: 'US',
        SeriesDescription: 'Liver',
        SOPClassUID: US_IMAGE_STORAGE,
        AcquisitionDate: '20260101',
        AcquisitionTime,
        InstanceNumber,
      });
      // Two sweeps, 5 minutes apart; the instance numbers do not follow time.
      const series = [
        us('100500', 1),
        us('100505', 2),
        us('100000', 3),
        us('100003', 4),
        us('100006', 5),
      ];
      const groups = groupInstancesBySplitRules(series as any, compileModule('usTimeClusters'));

      expect(rows(groups)).toEqual([
        ['usTimeClusters', [3, 4, 5]],
        ['usTimeClusters', [1, 2]],
      ]);
      expect(
        groups.map(
          group =>
            group.matchedRule.customAttributes(
              { instance: group.instances[0] },
              { instances: group.instances, series: group.series }
            ).SeriesDescription
        )
      ).toEqual(['Liver +0 s', 'Liver +300 s']);
    });
  });
});
