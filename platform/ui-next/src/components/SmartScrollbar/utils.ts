export interface ContiguousRun {
  start: number;
  length: number;
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

    runs.push({ start, length: i - start });
  }

  return runs;
}

/**
 * When `total >= pixelRowCount`: half-open item index range `[itemStart, itemEnd)`
 * covered by fill pixel row `pixelIndex`. `pixelRowCount` is `floor(pixelCount)` from callers.
 * Shared by `computePixelFilledFromMarked` and `computeIndicatorTopOffsetInFill` — keep in sync.
 */
function itemRangeForPixelRow(
  pixelIndex: number,
  total: number,
  pixelRowCount: number
): { itemStart: number; itemEnd: number } {
  const itemStart = Math.floor((pixelIndex * total) / pixelRowCount);
  const itemEnd = Math.floor(((pixelIndex + 1) * total) / pixelRowCount);
  return { itemStart, itemEnd };
}

/**
 * When `total >= pixelRowCount`: which fill pixel row owns `itemIndex` for the same
 * partition as `itemRangeForPixelRow` (inverse of scanning rows until
 * `itemIndex ∈ [itemStart, itemEnd)`).
 *
 * Readable form: `ceil((itemIndex + 1) * pixelRowCount / total) - 1`, clamped to `[0, pixelRowCount - 1]`.
 */
function pixelRowIndexForItemDownsample(
  itemIndex: number,
  total: number,
  pixelRowCount: number
): number {
  const rowIndex = Math.ceil(((itemIndex + 1) * pixelRowCount) / total) - 1;
  return Math.max(0, Math.min(pixelRowCount - 1, rowIndex));
}

/**
 * When `pixelRowCount > total`: half-open pixel row range `[pixelStart, pixelEnd)`
 * covered by `itemIndex`. `pixelRowCount` is `floor(pixelCount)` from callers.
 * Shared by `computePixelFilledFromMarked` and `computeIndicatorTopOffsetInFill` — keep in sync.
 */
function pixelSpanForItem(
  itemIndex: number,
  total: number,
  pixelRowCount: number
): { pixelStart: number; pixelEnd: number } {
  const pixelStart = Math.floor((itemIndex * pixelRowCount) / total);
  const pixelEnd = Math.floor(((itemIndex + 1) * pixelRowCount) / total);
  return { pixelStart, pixelEnd };
}

/**
 * Convert marked items (0/1 bytes) into a per-pixel fill mask (0/1 bytes).
 * The result is conservative in the sense that a pixel row is filled only when
 * its mapped items are all marked, so the fill never overstates coverage.
 *
 * - If `total >= pixelCount`: each pixel row maps to a disjoint item-index
 *   range; a pixel row is filled only if all items in that range are marked.
 * - If `pixelCount > total`: each item spans multiple pixel rows; if the item
 *   is marked, its entire pixel span is filled.
 */
export function computePixelFilledFromMarked(
  marked: Uint8Array,
  pixelCount: number
): Uint8Array {
  const total = marked.length;
  const pixelRowCount = Math.max(0, Math.floor(pixelCount));
  if (pixelRowCount === 0 || total <= 0) return new Uint8Array(0);

  const pixelFilled = new Uint8Array(pixelRowCount);

  if (total >= pixelRowCount) {
    for (let pixelIndex = 0; pixelIndex < pixelRowCount; pixelIndex++) {
      const { itemStart, itemEnd } = itemRangeForPixelRow(pixelIndex, total, pixelRowCount);
      if (itemEnd <= itemStart) continue;

      let filled = 1;
      for (let i = itemStart; i < itemEnd; i++) {
        if (marked[i] === 0) {
          filled = 0;
          break;
        }
      }
      pixelFilled[pixelIndex] = filled;
    }
  } else {
    for (let itemIndex = 0; itemIndex < total; itemIndex++) {
      if (marked[itemIndex] === 0) continue;
      const { pixelStart, pixelEnd } = pixelSpanForItem(itemIndex, total, pixelRowCount);
      for (let pixel = pixelStart; pixel < pixelEnd; pixel++) {
        pixelFilled[pixel] = 1;
      }
    }
  }

  return pixelFilled;
}

/**
 * Vertical offset (px) of the indicator within the fill strip `[0, pixelCount)`,
 * clamped so the indicator stays inside the track.
 *
 * - When `total >= pixelCount` (many slices, few pixel rows): same partition as
 *   `computePixelFilledFromMarked` (per-pixel item buckets); **top-align** the
 *   indicator to that row (then clamp so the thumb does not overflow the strip).
 * - When `pixelCount > total`: same per-item pixel spans as the fill’s upsample
 *   branch; first item top-aligned, last bottom-aligned, middle centered in bucket.
 * - Zero-height bucket (upsample only): top-aligned `pixelStart` from `pixelSpanForItem`.
 */
export function computeIndicatorTopOffsetInFill(
  itemIndex: number,
  total: number,
  pixelCount: number,
  indicatorHeight: number
): number {
  const pixelRowCount = Math.max(0, Math.floor(pixelCount));
  const indicatorHeightPx = Math.max(0, Math.floor(indicatorHeight));
  const maxTopInFill = Math.max(0, pixelRowCount - indicatorHeightPx);
  if (pixelRowCount === 0 || total <= 0) {
    return 0;
  }

  const clamp = (x: number) => Math.max(0, Math.min(maxTopInFill, x));

  if (total >= pixelRowCount) {
    const pixelRowIndex = pixelRowIndexForItemDownsample(itemIndex, total, pixelRowCount);
    return clamp(pixelRowIndex);
  } else {
    const { pixelStart, pixelEnd } = pixelSpanForItem(itemIndex, total, pixelRowCount);
    const bucketHeight = pixelEnd - pixelStart;

    let topOffset: number;
    if (bucketHeight <= 0) {
      topOffset = pixelStart;
    } else if (itemIndex === 0) {
      topOffset = pixelStart;
    } else if (itemIndex === total - 1) {
      topOffset = pixelEnd - indicatorHeightPx;
    } else {
      topOffset = pixelStart + Math.floor((bucketHeight - indicatorHeightPx) / 2);
    }

    return clamp(topOffset);
  }
}
