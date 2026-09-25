/**
 * Minimal view of a cornerstone voxel manager — only what clearing needs.
 */
export type ClearableVoxelManager = {
  getScalarDataLength: () => number;
  getAtIndex: (index: number) => number;
  setAtIndex: (index: number, value: number) => void;
};

/**
 * Cornerstone writes `options.segmentIndex || 1`, so anything falsy there lands on
 * segment 1. Normalising the same way keeps the segment we clear and the segment
 * cornerstone writes to in agreement — otherwise a caller passing 0 clears background
 * and then silently appends to segment 1 without clearing it first.
 */
export function normalizeSegmentIndex(segmentIndex: unknown): number {
  return Number.isInteger(segmentIndex) && (segmentIndex as number) > 0
    ? (segmentIndex as number)
    : 1;
}

/**
 * Zero every voxel belonging to `segmentIndex`, leaving all other segments intact.
 *
 * Cornerstone's `overwrite: true` clears the *whole* labelmap before writing, which
 * erases every other segment in the segmentation. Clearing just the segment being
 * recomputed keeps a re-run idempotent without destroying a user's other work.
 *
 * @returns the indices that were cleared, so the caller can put them back if the
 *   recomputation that follows throws.
 */
export default function clearSegmentFromLabelmap(
  voxelManager: ClearableVoxelManager,
  segmentIndex: number
): number[] {
  const length = voxelManager.getScalarDataLength();
  const cleared: number[] = [];

  for (let i = 0; i < length; i++) {
    if (voxelManager.getAtIndex(i) === segmentIndex) {
      voxelManager.setAtIndex(i, 0);
      cleared.push(i);
    }
  }

  return cleared;
}

/**
 * Put a cleared segment back, for when the recomputation after a clear throws.
 *
 * Only the previously occupied indices are written, so this cannot disturb voxels the
 * failed operation may already have set elsewhere.
 */
export function restoreSegmentToLabelmap(
  voxelManager: ClearableVoxelManager,
  indices: number[],
  segmentIndex: number
): void {
  for (const index of indices) {
    voxelManager.setAtIndex(index, segmentIndex);
  }
}
