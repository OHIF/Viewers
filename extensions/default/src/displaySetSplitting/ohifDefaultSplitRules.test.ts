import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import { ohifDefaultSplitRules } from './ohifDefaultSplitRules';

const MG_FOR_PRESENTATION = '1.2.840.10008.5.1.4.1.1.1.2';
const US_MULTIFRAME = '1.2.840.10008.5.1.4.1.1.3.1';
const MR_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.4';
const VIDEO_PHOTOGRAPHIC = '1.2.840.10008.5.1.4.1.1.77.1.4.1';
const WSI_STORAGE = '1.2.840.10008.5.1.4.1.1.77.1.6';
const BASIC_TEXT_SR = '1.2.840.10008.5.1.4.1.1.88.11';
const US_IMAGE = '1.2.840.10008.5.1.4.1.1.6.1';
const ENHANCED_US_VOLUME = '1.2.840.10008.5.1.4.1.1.6.2';
const NM_IMAGE = '1.2.840.10008.5.1.4.1.1.20';
const RT_IMAGE = '1.2.840.10008.5.1.4.1.1.481.1';
const OPHTHALMIC_TOMOGRAPHY = '1.2.840.10008.5.1.4.1.1.77.1.5.4';
const SEG_STORAGE = '1.2.840.10008.5.1.4.1.1.66.4';
const PARAMETRIC_MAP = '1.2.840.10008.5.1.4.1.1.30';
const RT_STRUCT = '1.2.840.10008.5.1.4.1.1.481.3';
const RT_DOSE = '1.2.840.10008.5.1.4.1.1.481.2';

let counter = 0;
const makeInstance = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: `sop-${++counter}`,
  SeriesInstanceUID: 'series-1',
  StudyInstanceUID: 'study-1',
  Rows: 256,
  Columns: 256,
  InstanceNumber: counter,
  ...overrides,
});

const split = instances => {
  const unmatched = [];
  const groups = groupInstancesBySplitRules(instances as any, ohifDefaultSplitRules, instance =>
    unmatched.push(instance)
  );
  return { groups, unmatched };
};

describe('ohifDefaultSplitRules', () => {
  beforeEach(() => {
    counter = 0;
  });

  it('contains the expected rules in order (guards upstream rule-id drift)', () => {
    expect(ohifDefaultSplitRules.map(rule => rule.id)).toEqual([
      'singleImageModality',
      'multiFrame',
      'mixedDimensionalityBValue',
      'volume3d',
      'defaultImageRule',
    ]);
  });

  it('creates one group per image for same-resolution mammography views', () => {
    const views = ['RCC', 'LCC', 'RMLO', 'LMLO'].map(view =>
      makeInstance({ Modality: 'MG', SOPClassUID: MG_FOR_PRESENTATION, ViewPosition: view })
    );
    const { groups, unmatched } = split(views);
    expect(unmatched).toHaveLength(0);
    expect(groups).toHaveLength(4);
    expect(groups.every(group => group.matchedRule.id === 'singleImageModality')).toBe(true);
    expect(groups.every(group => group.instances.length === 1)).toBe(true);
  });

  it('creates one group per instance for US multiframe clips (no SliceLocation)', () => {
    const clips = [1, 2, 3].map(() =>
      makeInstance({ Modality: 'US', SOPClassUID: US_MULTIFRAME, NumberOfFrames: 30 })
    );
    const { groups, unmatched } = split(clips);
    expect(unmatched).toHaveLength(0);
    expect(groups).toHaveLength(3);
    expect(groups.every(group => group.matchedRule.id === 'multiFrame')).toBe(true);
  });

  it('splits mixed-b-value MR series into two groups', () => {
    const instances = [
      makeInstance({ Modality: 'MR', SOPClassUID: MR_IMAGE_STORAGE, DiffusionBValue: 800 }),
      makeInstance({ Modality: 'MR', SOPClassUID: MR_IMAGE_STORAGE, DiffusionBValue: 800 }),
      makeInstance({ Modality: 'MR', SOPClassUID: MR_IMAGE_STORAGE }),
      makeInstance({ Modality: 'MR', SOPClassUID: MR_IMAGE_STORAGE }),
    ];
    const { groups } = split(instances);
    expect(groups).toHaveLength(2);
    expect(groups.every(group => group.matchedRule.id === 'mixedDimensionalityBValue')).toBe(true);
  });

  it('groups a uniform MR series into a single volume group', () => {
    const instances = [1, 2, 3].map(() =>
      makeInstance({ Modality: 'MR', SOPClassUID: MR_IMAGE_STORAGE })
    );
    const { groups } = split(instances);
    expect(groups).toHaveLength(1);
    expect(groups[0].matchedRule.id).toBe('volume3d');
  });

  it('leaves video, whole-slide and non-image instances unmatched', () => {
    const instances = [
      makeInstance({
        Modality: 'XC',
        SOPClassUID: VIDEO_PHOTOGRAPHIC,
        NumberOfFrames: 300,
        AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.100',
      }),
      makeInstance({ Modality: 'SM', SOPClassUID: WSI_STORAGE }),
      makeInstance({ Modality: 'SR', SOPClassUID: BASIC_TEXT_SR, Rows: undefined }),
    ];
    const { groups, unmatched } = split(instances);
    expect(groups).toHaveLength(0);
    expect(unmatched).toHaveLength(3);
  });

  // SEG / Parametric Map / RT Structure Set belong to dedicated extensions.
  // SEG and Parametric Map are multiframe image objects carrying `Rows`, so a
  // rule matching on pixel-data signals alone would claim them and their
  // viewports would never get their display sets.
  it.each([
    ['SEG', { Modality: 'SEG', SOPClassUID: SEG_STORAGE, NumberOfFrames: 40 }],
    ['Parametric Map', { Modality: 'OT', SOPClassUID: PARAMETRIC_MAP, NumberOfFrames: 20 }],
    ['RT Structure Set', { Modality: 'RTSTRUCT', SOPClassUID: RT_STRUCT, Rows: undefined }],
  ])('leaves %s to its dedicated SOP class handler', (_label, overrides) => {
    const { groups, unmatched } = split([makeInstance(overrides)]);
    expect(groups).toHaveLength(0);
    expect(unmatched).toHaveLength(1);
  });

  // These are all in the stack handler's registration list but absent from
  // upstream's `isImageInstance` SOP class list, so they must be matched via
  // stack ownership rather than that list.
  it.each([
    ['Ultrasound still', { Modality: 'US', SOPClassUID: US_IMAGE }],
    ['Enhanced US Volume', { Modality: 'US', SOPClassUID: ENHANCED_US_VOLUME }],
    ['NM', { Modality: 'NM', SOPClassUID: NM_IMAGE }],
    ['RT Image', { Modality: 'RTIMAGE', SOPClassUID: RT_IMAGE }],
    ['RT Dose', { Modality: 'RTDOSE', SOPClassUID: RT_DOSE }],
    ['Ophthalmic tomography', { Modality: 'OPT', SOPClassUID: OPHTHALMIC_TOMOGRAPHY }],
  ])('claims %s instances that upstream isImageInstance omits', (_label, overrides) => {
    const { groups, unmatched } = split([makeInstance(overrides)]);
    expect(unmatched).toHaveLength(0);
    expect(groups).toHaveLength(1);
    expect(groups[0].matchedRule.id).toBe('defaultImageRule');
  });

  it('keeps a mixed ultrasound series on a single path', () => {
    // A clip plus stills: before stack-ownership gating the clip was split and
    // the stills fell through to the legacy handler, splitting one series
    // across both display set creation paths.
    const instances = [
      makeInstance({ Modality: 'US', SOPClassUID: US_MULTIFRAME, NumberOfFrames: 30 }),
      makeInstance({ Modality: 'US', SOPClassUID: US_IMAGE }),
      makeInstance({ Modality: 'US', SOPClassUID: US_IMAGE }),
    ];
    const { groups, unmatched } = split(instances);
    expect(unmatched).toHaveLength(0);
    expect(groups.map(group => group.matchedRule.id).sort()).toEqual([
      'defaultImageRule',
      'multiFrame',
    ]);
    // The clip gets its own display set; the two stills share one.
    expect(groups.find(g => g.matchedRule.id === 'multiFrame').instances).toHaveLength(1);
    expect(groups.find(g => g.matchedRule.id === 'defaultImageRule').instances).toHaveLength(2);
  });
});
