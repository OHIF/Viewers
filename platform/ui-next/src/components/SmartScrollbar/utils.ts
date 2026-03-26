export interface ContiguousRun {
  start: number;
  length: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Given a Set of indices and a total count, returns contiguous runs
 * sorted by start index. Each run includes metadata about whether
 * it's the first/last run for border-radius decisions.
 */
export function getContiguousRuns(
  indices: Set<number>,
  totalSlices: number
): ContiguousRun[] {
  if (indices.size === 0) return [];

  const sorted = Array.from(indices).sort((a, b) => a - b);
  const runs: ContiguousRun[] = [];
  let runStart = sorted[0];
  let runLength = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      runLength++;
    } else {
      runs.push({ start: runStart, length: runLength, isFirst: false, isLast: false });
      runStart = sorted[i];
      runLength = 1;
    }
  }
  runs.push({ start: runStart, length: runLength, isFirst: false, isLast: false });

  // Mark first and last
  if (runs.length > 0) {
    runs[0].isFirst = true;
    runs[runs.length - 1].isLast = true;
  }

  // Filter to valid range and clamp lengths that extend past totalSlices
  return runs
    .filter(r => r.start >= 0 && r.start < totalSlices)
    .map(r => ({ ...r, length: Math.min(r.length, totalSlices - r.start) }));
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
