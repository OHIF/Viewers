/**
 * Formats values for safe text display.
 */
export default function formatValue(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && typeof value.Alphabetic === 'string') {
    return value.Alphabetic;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
}
