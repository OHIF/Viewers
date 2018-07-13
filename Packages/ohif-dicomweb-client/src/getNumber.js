/**
 * Returns the first string value as a Javascript Number
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The default value to return if the element does not exist
 * @returns {*}
 */
export default function getNumber(element, defaultValue) {
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

    return parseFloat(element.Value[0]);
};
