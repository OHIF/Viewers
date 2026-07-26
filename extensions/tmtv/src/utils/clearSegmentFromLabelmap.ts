/**
 * Minimal view of a cornerstone voxel manager — only what clearing needs.
 */
export type ClearableVoxelManager = {
  getScalarDataLength: () => number;
  getAtIndex: (index: number) => number;
  setAtIndex: (index: number, value: number) => void;
};

/**
 * Zero every voxel belonging to `segmentIndex`, leaving all other segments intact.
 *
 * Cornerstone's `overwrite: true` clears the *whole* labelmap before writing, which
 * erases every other segment in the segmentation. Clearing just the segment being
 * recomputed keeps a re-run idempotent without destroying a user's other work.
 *
 * @returns the number of voxels cleared.
 */
export default function clearSegmentFromLabelmap(
  voxelManager: ClearableVoxelManager,
  segmentIndex: number
): number {
  const length = voxelManager.getScalarDataLength();
  let cleared = 0;

  for (let i = 0; i < length; i++) {
    if (voxelManager.getAtIndex(i) === segmentIndex) {
      voxelManager.setAtIndex(i, 0);
      cleared++;
    }
  }

  return cleared;
}
