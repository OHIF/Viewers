/**
 * Returns the specified element as a dicom sequence.
 *
 * @param element - The group/element of the element (e.g. '00280009')
 * @param [defaultValue] - The value to return if the element is not present
 * @returns {*}
 */
export default function getSequence(element, defaultValue) {
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

  return element.Value;
}
