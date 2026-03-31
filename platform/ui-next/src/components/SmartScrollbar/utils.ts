export interface ContiguousRun {
  start: number;
  length: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Given a Uint8Array where each non-zero byte represents a set position,
 * returns contiguous runs in a single O(n) pass. No sorting or heap
 * allocations inside the loop.
 */
export function computeContiguousRuns(bytes: Uint8Array): ContiguousRun[] {
  const runs: ContiguousRun[] = [];
  const n = bytes.length;
  let i = 0;

  while (i < n) {
    while (i < n && bytes[i] === 0) i++;
    if (i >= n) break;

    const start = i;
    while (i < n && bytes[i] !== 0) i++;

    runs.push({ start, length: i - start, isFirst: false, isLast: false });
  }

  if (runs.length > 0) {
    runs[0].isFirst = true;
    runs[runs.length - 1].isLast = true;
  }

  return runs;
}

/**
 * Compute the indicator's total visual dimensions and horizontal position.
 * Design 27: pill shape, center position, 1px border.
 */
export function getIndicatorLayout(
  trackWidth: number,
  indicatorSize: number,
  borderWidth: number,
): { totalWidth: number; totalHeight: number; fillWidth: number; fillHeight: number; leftPos: number } {
  const visualSize = indicatorSize * 1.25;
  const fillWidth = visualSize;
  const fillHeight = Math.round(visualSize / 2); // pill = half height
  const totalWidth = fillWidth + borderWidth * 2;
  const totalHeight = fillHeight + borderWidth * 2;

  const centerX = trackWidth / 2;
  const leftPos = centerX - totalWidth / 2;

  return { totalWidth, totalHeight, fillWidth, fillHeight, leftPos };
}
