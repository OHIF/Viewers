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
 * @param writer - where the zeros go, for example the voxel manager of a labelmap
 *   memo, so that undo restores the segment. A memo voxel manager reads back its
 *   recorded values, not the labelmap, so the reads stay on `voxelManager`.
 */
export default function clearSegmentFromLabelmap(
  voxelManager: ClearableVoxelManager,
  segmentIndex: number,
  writer: Pick<ClearableVoxelManager, 'setAtIndex'> = voxelManager
): void {
  const length = voxelManager.getScalarDataLength();

  for (let i = 0; i < length; i++) {
    if (voxelManager.getAtIndex(i) === segmentIndex) {
      writer.setAtIndex(i, 0);
    }
  }
}
