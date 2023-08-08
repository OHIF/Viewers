/**
 * Formats a patient name for display purposes
 */
export default function formatPN(name) {
  if (!name) {
    return;
  }

  let nameToUse = name.Alphabetic ?? name;
  if (typeof nameToUse === 'object') {
    nameToUse = '';
  }

  // Convert the first ^ to a ', '. String.replace() only affects
  // the first appearance of the character.
  const commaBetweenFirstAndLast = nameToUse.replace('^', ', ');

  // Replace any remaining '^' characters with spaces
  const cleaned = commaBetweenFirstAndLast.replace(/\^/g, ' ');

  // Trim any extraneous whitespace
  return cleaned.trim();
}
