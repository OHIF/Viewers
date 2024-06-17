/**
 * Formats a patient name for display purposes.
 *
 * @param {string} name DICOM patient name string
 * @returns {string} formatted name
 */
export default function formatDICOMPatientName(name) {
  if (typeof name !== 'string') {
    return;
  }

  /**
   * Convert the first ^ to a ', '. String.replace() only affects
   * the first appearance of the character.
   */
  const commaBetweenFirstAndLast = name.replace('^', ', ');

  /** Replace any remaining '^' characters with spaces */
  const cleaned = commaBetweenFirstAndLast.replace(/\^/g, ' ');

  /** Trim any extraneous whitespace */
  return cleaned.trim();
}
