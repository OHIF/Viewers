/**
 * Returns the specified element as a string.  Multi-valued elements will be separated by a backslash
 *
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The value to return if the element is not present
 * @returns {*}
 */
export default function getString(element, defaultValue) {
  if (!element) {
    return defaultValue;
  }
  // Value is not present if the attribute has a zero length value
  if (!element.Value) {
    return defaultValue;
  }
  // Sanity check to make sure we have at least one entry in the array.
  if (!element.Value.length) {
    return defaultValue;
  }
  // Join the array together separated by backslash
  // NOTE: Orthanc does not correctly split values into an array so the join is a no-op
  return element.Value.join('\\');
}
