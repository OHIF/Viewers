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
  const count = Math.max(0, Math.floor(pixelCount));
  if (count === 0 || total <= 0) return new Uint8Array(0);

  const pixelFilled = new Uint8Array(count);

  if (total >= count) {
    for (let pixelIndex = 0; pixelIndex < count; pixelIndex++) {
      const start = Math.floor((pixelIndex * total) / count);
      const end = Math.floor(((pixelIndex + 1) * total) / count);
      if (end <= start) continue;

      let filled = 1;
      for (let itemIndex = start; itemIndex < end; itemIndex++) {
        if (marked[itemIndex] === 0) {
          filled = 0;
          break;
        }
      }
      pixelFilled[pixelIndex] = filled;
    }
  } else {
    for (let itemIndex = 0; itemIndex < total; itemIndex++) {
      if (marked[itemIndex] === 0) continue;
      const topPx = Math.floor((itemIndex * count) / total);
      const bottomPx = Math.floor(((itemIndex + 1) * count) / total);
      for (let pixel = topPx; pixel < bottomPx; pixel++) {
        pixelFilled[pixel] = 1;
      }
    }
  }

  return pixelFilled;
}
