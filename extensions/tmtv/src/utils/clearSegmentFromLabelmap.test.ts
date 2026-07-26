import clearSegmentFromLabelmap from './clearSegmentFromLabelmap';

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

    expect(cleared).toBe(3);
    expect(vm.data).toEqual([0, 0, 2, 0, 3, 0, 2, 0]);
  });

  it('is a no-op when the target segment is absent', () => {
    const vm = fakeVoxelManager([0, 2, 3, 2]);

    expect(clearSegmentFromLabelmap(vm, 1)).toBe(0);
    expect(vm.data).toEqual([0, 2, 3, 2]);
  });

  it('leaves the labelmap unchanged when asked for segment 0', () => {
    // Segment 0 is background, so this writes 0 over 0. It is a caller mistake rather
    // than a supported operation, but it must not disturb any real segment.
    const vm = fakeVoxelManager([0, 1, 0, 2]);

    clearSegmentFromLabelmap(vm, 0);

    expect(vm.data).toEqual([0, 1, 0, 2]);
  });

  it('is idempotent, so re-running the threshold tool converges', () => {
    const vm = fakeVoxelManager([1, 1, 2]);

    clearSegmentFromLabelmap(vm, 1);
    const second = clearSegmentFromLabelmap(vm, 1);

    expect(second).toBe(0);
    expect(vm.data).toEqual([0, 0, 2]);
  });

  it('handles an empty labelmap', () => {
    const vm = fakeVoxelManager([]);
    expect(clearSegmentFromLabelmap(vm, 1)).toBe(0);
  });

  it('clears every voxel when the labelmap holds only the target segment', () => {
    const vm = fakeVoxelManager([4, 4, 4]);

    expect(clearSegmentFromLabelmap(vm, 4)).toBe(3);
    expect(vm.data).toEqual([0, 0, 0]);
  });
});
