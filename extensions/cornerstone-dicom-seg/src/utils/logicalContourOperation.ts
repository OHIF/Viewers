/**
 * A logical contour operation combines segment A with segment B, so both have
 * to be selected. An empty selection or segment index 0 (no segment) is not.
 */
export function hasOperandSegments(segmentA?: string | null, segmentB?: string | null): boolean {
  return Number(segmentA) > 0 && Number(segmentB) > 0;
}
