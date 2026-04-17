import { computeContiguousRuns, computePixelFilledFromMarked } from './utils';

function u8(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

describe('computePixelFilledFromMarked', () => {
  it('returns empty when pixelCount <= 0', () => {
    expect(computePixelFilledFromMarked(u8([1, 1, 1]), 0)).toEqual(new Uint8Array(0));
    expect(computePixelFilledFromMarked(u8([1, 1, 1]), -10)).toEqual(new Uint8Array(0));
  });

  it('returns empty when marked is empty', () => {
    expect(computePixelFilledFromMarked(new Uint8Array(0), 10)).toEqual(new Uint8Array(0));
  });

  it('downsamples conservatively when total >= pixelCount (AND within each bucket)', () => {
    // total=7, pixelCount=3 => buckets [0..2), [2..4), [4..7) (requires rounding)
    const marked = u8([1, 1, 1, 0, 1, 1, 1]);
    const result = computePixelFilledFromMarked(marked, 3);
    expect(Array.from(result)).toEqual([1, 0, 1]);
  });

  it('downsamples conservatively with uneven bucket sizes (requires rounding)', () => {
    // total=5, pixelCount=4 => buckets [0..1), [1..2), [2..3), [3..5)
    const marked = u8([1, 1, 1, 1, 0]);
    const result = computePixelFilledFromMarked(marked, 4);
    expect(Array.from(result)).toEqual([1, 1, 1, 0]);
  });

  it('upsamples by filling the full pixel span of each marked item when pixelCount > total', () => {
    // total=4, pixelCount=7 =>
    // item 0 spans pixels [0..1) (requires rounding)
    // item 2 spans pixels [3..5) (requires rounding)
    const marked = u8([1, 0, 1, 0]);
    const result = computePixelFilledFromMarked(marked, 7);
    expect(Array.from(result)).toEqual([1, 0, 0, 1, 1, 0, 0]);
  });

  it('upsamples correctly when a marked item maps to a single pixel row', () => {
    // total=6, pixelCount=7 => items 0..4 each map to exactly 1 pixel; item 5 maps to 2 pixels.
    const marked = u8([0, 0, 0, 1, 0, 1]); // item 3 => pixel 3; item 5 => pixels 5-6
    const result = computePixelFilledFromMarked(marked, 7);
    expect(Array.from(result)).toEqual([0, 0, 0, 1, 0, 1, 1]);
  });

  it('uses Math.floor(pixelCount) for output length (downsample branch)', () => {
    const marked = u8([1, 0, 1, 0]);
    expect(computePixelFilledFromMarked(marked, 3.9)).toHaveLength(3);
    expect(computePixelFilledFromMarked(marked, 3.1)).toHaveLength(3);
  });

  it('uses Math.floor(pixelCount) for output length (upsample branch)', () => {
    const marked = u8([1, 0, 1]);
    expect(computePixelFilledFromMarked(marked, 7.9)).toHaveLength(7);
    expect(computePixelFilledFromMarked(marked, 7.1)).toHaveLength(7);
  });
});

describe('computeContiguousRuns', () => {
  it('returns [] for empty input', () => {
    expect(computeContiguousRuns(new Uint8Array(0))).toEqual([]);
  });

  it('returns [] when all bytes are zero', () => {
    expect(computeContiguousRuns(u8([0, 0, 0, 0]))).toEqual([]);
  });

  it('returns a single run when all bytes are non-zero', () => {
    expect(computeContiguousRuns(u8([1, 1, 2, 3]))).toEqual([{ start: 0, length: 4 }]);
  });

  it('finds runs with leading/trailing zeros', () => {
    expect(computeContiguousRuns(u8([0, 0, 1, 1, 0, 2, 0, 0]))).toEqual([
      { start: 2, length: 2 },
      { start: 5, length: 1 },
    ]);
  });

  it('treats any non-zero byte as filled', () => {
    expect(computeContiguousRuns(u8([0, 255, 128, 0]))).toEqual([{ start: 1, length: 2 }]);
  });
});
