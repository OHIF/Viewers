/**
 * Returns an array of unique values for the given attribute from a series array.
 * If the attribute is not present on the series, attempts to get it from the first instance.
 * @param {Array} series - The series array to extract attributes from.
 * @param {string} attribute - The attribute name to extract.
 * @returns {Array} Array of unique attribute values.
 */
export function getUniqueAttributeFromList(series, attribute) {
  return series.reduce((prev, curr) => {
    let value = curr[attribute];
    if (!value && curr.instances && curr.instances[0]) {
      value = curr.instances[0][attribute];
    }
    if (value && prev.indexOf(value) === -1) {
      prev.push(value);
    }
    return prev;
  }, []);
}
