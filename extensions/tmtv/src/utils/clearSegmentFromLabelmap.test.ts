import clearSegmentFromLabelmap, {
  normalizeSegmentIndex,
  restoreSegmentToLabelmap,
} from './clearSegmentFromLabelmap';

/**
 * Regression cover for #5476: the Rectangle ROI Threshold tool used cornerstone's
 * `overwrite: true`, which zeroes the whole labelmap and so deleted every segment
 * drawn with the brush / shape tools.
 */
const fakeVoxelManager = (voxels: number[]) => {
  const data = [...voxels];
  return {
    data,
    getScalarDataLength: () => data.length,
    getAtIndex: (i: number) => data[i],
    setAtIndex: (i: number, v: number) => {
      data[i] = v;
    },
  };
};

describe('clearSegmentFromLabelmap', () => {
  it('clears only the target segment and leaves the others intact', () => {
    const vm = fakeVoxelManager([0, 1, 2, 1, 3, 1, 2, 0]);

    const cleared = clearSegmentFromLabelmap(vm, 1);

    expect(cleared).toEqual([1, 3, 5]);
    expect(vm.data).toEqual([0, 0, 2, 0, 3, 0, 2, 0]);
  });

  it('is a no-op when the target segment is absent', () => {
    const vm = fakeVoxelManager([0, 2, 3, 2]);

    expect(clearSegmentFromLabelmap(vm, 1)).toEqual([]);
    expect(vm.data).toEqual([0, 2, 3, 2]);
  });

  it('is idempotent, so re-running the threshold tool converges', () => {
    const vm = fakeVoxelManager([1, 1, 2]);

    clearSegmentFromLabelmap(vm, 1);
    const second = clearSegmentFromLabelmap(vm, 1);

    expect(second).toEqual([]);
    expect(vm.data).toEqual([0, 0, 2]);
  });

  it('handles an empty labelmap', () => {
    const vm = fakeVoxelManager([]);
    expect(clearSegmentFromLabelmap(vm, 1)).toEqual([]);
  });

  it('clears every voxel when the labelmap holds only the target segment', () => {
    const vm = fakeVoxelManager([4, 4, 4]);

    expect(clearSegmentFromLabelmap(vm, 4)).toEqual([0, 1, 2]);
    expect(vm.data).toEqual([0, 0, 0]);
  });
});

describe('normalizeSegmentIndex', () => {
  it('keeps a valid positive integer', () => {
    expect(normalizeSegmentIndex(3)).toBe(3);
  });

  it.each([
    ['zero (background)', 0],
    ['negative', -2],
    ['non-integer', 1.5],
    ['undefined', undefined],
    ['null', null],
    ['NaN', NaN],
    ['a string', '2'],
  ])('falls back to 1 for %s', (_label, input) => {
    expect(normalizeSegmentIndex(input)).toBe(1);
  });

  it('matches how cornerstone resolves the write target', () => {
    // thresholdVolumeByRange writes `options.segmentIndex || 1`. If we cleared a
    // different index than cornerstone writes to, the clear would miss and the write
    // would append to an uncleared segment.
    for (const input of [0, undefined, null, NaN]) {
      const cornerstoneTarget = (input as number) || 1;
      expect(normalizeSegmentIndex(input)).toBe(cornerstoneTarget);
    }
  });
});

describe('restoreSegmentToLabelmap', () => {
  it('puts a cleared segment back', () => {
    const vm = fakeVoxelManager([0, 1, 2, 1]);
    const cleared = clearSegmentFromLabelmap(vm, 1);
    expect(vm.data).toEqual([0, 0, 2, 0]);

    restoreSegmentToLabelmap(vm, cleared, 1);

    expect(vm.data).toEqual([0, 1, 2, 1]);
  });

  it('only touches the indices it was given', () => {
    // Voxels a failed operation already wrote elsewhere must survive the rollback.
    const vm = fakeVoxelManager([0, 0, 0, 0]);
    vm.data[2] = 7;

    restoreSegmentToLabelmap(vm, [0], 1);

    expect(vm.data).toEqual([1, 0, 7, 0]);
  });

  it('is a no-op for an empty index list', () => {
    const vm = fakeVoxelManager([5, 6]);
    restoreSegmentToLabelmap(vm, [], 1);
    expect(vm.data).toEqual([5, 6]);
  });
});
