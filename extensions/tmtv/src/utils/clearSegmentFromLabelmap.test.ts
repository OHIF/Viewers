import clearSegmentFromLabelmap, { normalizeSegmentIndex } from './clearSegmentFromLabelmap';

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

    clearSegmentFromLabelmap(vm, 1);

    expect(vm.data).toEqual([0, 0, 2, 0, 3, 0, 2, 0]);
  });

  it('sends the writes to the writer, for an undo memo', () => {
    const vm = fakeVoxelManager([1, 2, 1]);
    const writes: number[][] = [];

    clearSegmentFromLabelmap(vm, 1, { setAtIndex: (i, v) => writes.push([i, v]) });

    expect(writes).toEqual([
      [0, 0],
      [2, 0],
    ]);
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
});
