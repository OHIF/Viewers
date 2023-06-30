/**
 * Formats a patient name for display purposes
 */
export default function formatPN(name) {
  if (!name) {
    return;
  }

  let nameToUse;
  const _nameToUse = name.Alphabetic ?? name;
  if (typeof _nameToUse === 'string' || _nameToUse instanceof String) {
    nameToUse = _nameToUse;
  } else {
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
