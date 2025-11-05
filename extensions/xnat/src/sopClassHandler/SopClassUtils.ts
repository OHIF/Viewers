/**
 * SOP Class utility functions
 * Extracted from getSopClassHandlerModule.tsx
 */

/**
 * Extract unique SOP Class UIDs from instances
 * @param instances - Array of DICOM instances
 * @returns Array of unique SOP Class UIDs
 */
export function getSopClassUids(instances: any[]): string[] {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}
