import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import { ohifDefaultSplitRules } from './ohifDefaultSplitRules';

const MG_FOR_PRESENTATION = '1.2.840.10008.5.1.4.1.1.1.2';
const US_MULTIFRAME = '1.2.840.10008.5.1.4.1.1.3.1';
const MR_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.4';
const VIDEO_PHOTOGRAPHIC = '1.2.840.10008.5.1.4.1.1.77.1.4.1';
const WSI_STORAGE = '1.2.840.10008.5.1.4.1.1.77.1.6';
const BASIC_TEXT_SR = '1.2.840.10008.5.1.4.1.1.88.11';

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
});
