import toNumber from './toNumber';

/**
 * Reads a **single-valued** numeric DICOM attribute as a number, or `undefined` when
 * it carries no usable value.
 *
 * A DICOM attribute can be *present but empty* — the tag is sent with zero values —
 * and for a single-valued attribute that is indistinguishable from the tag being
 * absent. `toNumber` maps an empty value to `[]`, and `[]` is **truthy** in
 * JavaScript, so a consumer guarding with `if (value)` accepts it and then does
 * arithmetic on an array.
 *
 * That is not hypothetical. Cornerstone derives the z-spacing of a single-image
 * volume from `sliceThickness` with exactly that guard, so an empty `SliceThickness`
 * became a spacing of `[]`; the slice arithmetic downstream then parked the viewport
 * billions of slices away from its data and it rendered nothing at all. Empty values
 * are common — the same instances carry ten other empty tags.
 *
 * Returning `undefined` lets each consumer run the absent-value fallback it already
 * has, which is what it would have done had the tag never been sent.
 *
 * A one-element array is the ordinary DICOM-JSON shape for a single value and is
 * unwrapped. Multi-valued attributes (`PixelSpacing`, `ImagePositionPatient`, …) are
 * not this function's business — they keep using `toNumber`.
 *
 * @param value - The raw value for a single-valued numeric attribute.
 * @returns The value as a finite number, or `undefined`.
 */
export default function toScalarNumber(value): number | undefined {
  const scalar = Array.isArray(value) ? value[0] : value;

  // Spelled out rather than left to `toNumber`, which sends both `null` and `''`
  // through `Number()` and returns 0 — a thickness of zero, from a tag that said
  // nothing.
  if (scalar === undefined || scalar === null || scalar === '') {
    return undefined;
  }

  const numeric = toNumber(scalar);

  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : undefined;
}
