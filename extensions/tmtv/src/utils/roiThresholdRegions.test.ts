import { forEachVoxelInRegions, getROIThresholdRegions } from './roiThresholdRegions';

// 20 x 20 x 10 voxels, 1 mm in plane, 2 mm slices, axis aligned.
const DIMS = [20, 20, 10];
const volume = {
  dimensions: DIMS,
  direction: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  spacing: [1, 1, 2],
  origin: [0, 0, 0],
  voxelManager: { toIndex: ([i, j, k]) => i + j * DIMS[0] + k * DIMS[0] * DIMS[1] },
} as never;

const AXIAL = [0, 0, 1];

function collect(annotation) {
  const voxels: number[][] = [];
  forEachVoxelInRegions(getROIThresholdRegions([annotation], volume), volume, (_i, ijk) =>
    voxels.push([...ijk])
  );
  return voxels;
}

const slicesOf = (voxels: number[][]) => [...new Set(voxels.map(v => v[2]))].sort();

/** Rectangle corners in the tool's order: 0 and 3 are opposite. */
function rectangle(center: number[], u: number[], v: number[], half: number) {
  const at = (a: number, b: number) => center.map((c, i) => c + a * half * u[i] + b * half * v[i]);
  return [at(-1, -1), at(1, -1), at(-1, 1), at(1, 1)];
}

describe('getROIThresholdRegions', () => {
  it('selects the rotated rectangle, not its IJK bounding box', () => {
    const s = Math.SQRT1_2;
    const u = [s, s, 0];
    const v = [-s, s, 0];
    const voxels = collect({
      metadata: { toolName: 'RectangleROIThreshold', viewPlaneNormal: AXIAL },
      data: { handles: { points: rectangle([10, 10, 4], u, v, 4) } },
    });

    // A flat tool without a reference thickness covers one voxel: slice z = 4 mm.
    expect(slicesOf(voxels)).toEqual([2]);
    for (const [i, j] of voxels) {
      const du = (i - 10) * u[0] + (j - 10) * u[1];
      const dv = (i - 10) * v[0] + (j - 10) * v[1];
      expect(Math.max(Math.abs(du), Math.abs(dv))).toBeLessThanOrEqual(4 + 1e-6);
    }
    // The square has 64 mm2; its bounding box (i, j in 5..15) has 121 voxels.
    expect(voxels.length).toBeGreaterThan(50);
    expect(voxels.length).toBeLessThan(80);
  });

  it('extrudes a StartEnd rectangle from the start slice to the end slice, inclusive', () => {
    const voxels = collect({
      metadata: { toolName: 'RectangleROIStartEndThreshold', viewPlaneNormal: AXIAL },
      data: {
        startCoordinate: 4,
        endCoordinate: 12,
        handles: { points: rectangle([10, 10, 4], [1, 0, 0], [0, 1, 0], 2) },
      },
    });

    expect(slicesOf(voxels)).toEqual([2, 3, 4, 5, 6]);
    // 5 x 5 voxel centres in each slice.
    expect(voxels.length).toBe(5 * 25);
  });

  it('supports the CircleROIStartEndThreshold tool', () => {
    const voxels = collect({
      metadata: { toolName: 'CircleROIStartEndThreshold', viewPlaneNormal: AXIAL },
      data: {
        startCoordinate: [0, 0, 8],
        endCoordinate: [0, 0, 4],
        handles: {
          points: [
            [10, 10, 8],
            [13, 10, 8],
          ],
        },
      },
    });

    expect(slicesOf(voxels)).toEqual([2, 3, 4]);
    // 29 integer points lie within radius 3.
    expect(voxels.length).toBe(3 * 29);
  });

  it('rejects an annotation of another tool', () => {
    expect(() =>
      getROIThresholdRegions(
        [{ metadata: { toolName: 'Length', viewPlaneNormal: AXIAL }, data: { handles: {} } }],
        volume
      )
    ).toThrow('does not support Length');
  });
});
