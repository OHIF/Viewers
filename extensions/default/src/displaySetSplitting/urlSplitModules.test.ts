import fs from 'fs';
import path from 'path';
import { createDisplaySetSplitRules, groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import { ohifDefaultSplitRules, ohifSplitRuleClassifiers } from './ohifDefaultSplitRules';

/**
 * The `split/*.jsonc` URL modules in platform/app/public are data that no
 * build step checks. The compiler is strict, so a module with an unknown key
 * or a bad form only fails when a user loads it. These tests compile each
 * module over the OHIF defaults, as `?customization=split/<name>` does.
 */
const SPLIT_DIR = path.resolve(__dirname, '../../../../platform/app/public/customizations/split');

/** The modules hold only full-line `//` comments, so JSON.parse reads the rest. */
const readModule = (name: string) =>
  JSON.parse(
    fs
      .readFileSync(path.join(SPLIT_DIR, `${name}.jsonc`), 'utf8')
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
  );

/** Applies the `$merge` of a module's `splitRules` over the OHIF defaults. */
const compileModule = (name: string) => {
  const added = readModule(name).global.useMetadataDisplaySet.splitRules.$merge;
  return createDisplaySetSplitRules(
    { ...ohifDefaultSplitRules, ...added },
    { classifiers: ohifSplitRuleClassifiers }
  );
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

describe('split URL modules', () => {
  beforeEach(() => {
    counter = 0;
  });

  it('every split module parses, and every module that adds rules compiles', () => {
    const names = fs
      .readdirSync(SPLIT_DIR)
      .filter(file => file.endsWith('.jsonc'))
      .map(file => file.replace(/\.jsonc$/, ''));
    expect(names).toEqual(
      expect.arrayContaining(['enableNewSplit', 'scoutSeries', 'dwiByBValue', 'dxCrSingleImages'])
    );
    for (const name of names) {
      const module = readModule(name);
      if (module.global?.useMetadataDisplaySet?.splitRules) {
        expect(() => compileModule(name)).not.toThrow();
      }
    }
  });

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

  describe('dxCrSingleImages', () => {
    const SOP_CLASS = {
      DX: '1.2.840.10008.5.1.4.1.1.1.1',
      CR: '1.2.840.10008.5.1.4.1.1.1',
      MG: '1.2.840.10008.5.1.4.1.1.1.2',
    };
    const image = (Modality: 'DX' | 'CR' | 'MG') => ({
      ...mr(),
      SeriesDescription: Modality,
      Modality,
      SOPClassUID: SOP_CLASS[Modality],
    });
    const splitSeries = (Modality: 'DX' | 'CR' | 'MG', count: number) =>
      groupInstancesBySplitRules(
        Array.from({ length: count }, () => image(Modality)) as any,
        compileModule('dxCrSingleImages')
      ).map(group => [group.matchedRule.id, group.instances.length]);

    it.each(['DX', 'CR'] as const)(
      'makes one display set for each image of a %s series',
      modality => {
        expect(splitSeries(modality, 3)).toEqual([
          ['dxCrSingleImages', 1],
          ['dxCrSingleImages', 1],
          ['dxCrSingleImages', 1],
        ]);
      }
    );

    it('splits a series of 9 images, and keeps a series of 10 images together', () => {
      expect(splitSeries('DX', 9)).toHaveLength(9);
      expect(splitSeries('DX', 10)).toEqual([['defaultImageRule', 10]]);
    });

    it('keeps an MG series together', () => {
      expect(splitSeries('MG', 4)).toEqual([['defaultImageRule', 4]]);
    });
  });
});
