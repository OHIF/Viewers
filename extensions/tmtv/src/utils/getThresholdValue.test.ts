jest.mock('@cornerstonejs/core', () => ({
  utilities: { transformWorldToIndex: (_imageData, point) => point },
}));

// The regions hold labelmap indices 0, 1 and 2, at world x = index.
jest.mock('./roiThresholdRegions', () => ({
  forEachVoxelInRegions: (_regions, _volume, callback) =>
    [0, 1, 2].forEach(index => callback(index, [index, 0, 0], [index, 0, 0])),
}));

import getThresholdValues from './getThresholdValue';

describe('getThresholdValues', () => {
  it('ignores the SUV of a voxel that another segment owns', () => {
    const suv = [4, 10, 6];
    const ptVolume = { voxelManager: { getAtIJKPoint: ([i]) => suv[i] } };
    // Index 1, the hottest voxel, belongs to another segment.
    const isFree = (index: number) => index !== 1;

    const { ptLower } = getThresholdValues([], {} as never, isFree, ptVolume as never, {
      strategy: 'max',
      weight: 0.5,
    });

    expect(ptLower).toBe(3);
  });
});
