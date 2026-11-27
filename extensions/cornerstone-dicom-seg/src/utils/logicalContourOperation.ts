/**
 * A logical contour operation combines segment A with segment B, so both have
 * to be selected and still exist in the segmentation. An empty selection or
 * segment index 0 (no segment) is not a segment.
 */
export function hasOperandSegments(
  segmentA: string | null | undefined,
  segmentB: string | null | undefined,
  segmentIndices: number[]
): boolean {
  return [segmentA, segmentB].every(
    segment => Number(segment) > 0 && segmentIndices.includes(Number(segment))
  );
}
