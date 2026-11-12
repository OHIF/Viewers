/**
 * Checks whether two viewports share at least one common display set.
 *
 * This method checks to see if the source and target share a display set.
 * It performs an O(n * m) comparison between the display sets of each viewport.
 * Since each viewport typically contains only a small number of display sets (≤ 5),
 * the computational cost is negligible.
 *
 * @param sourceDisplaySetUIDs - Array of displaySetInstanceUID from the source viewport.
 * @param targetDisplaySetUIDs - Array of displaySetInstanceUID from the target viewport.
 * @returns true if at least one display set is common; false otherwise.
 */
export function isAnyDisplaySetCommon(
  sourceDisplaySetUIDs: string[],
  targetDisplaySetUIDs: string[]
): boolean {
  return sourceDisplaySetUIDs.some(uid => targetDisplaySetUIDs.includes(uid));
}
