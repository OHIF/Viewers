/**
 * Returns the Alphabetic version of a PN
 *
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The default value to return if the element is not found
 * @returns {*}
 */
export default function getName(element, defaultValue) {
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
    // Return the Alphabetic component group
    if (element.Value[0].Alphabetic) {
        return element.Value[0].Alphabetic;
    }
    // Orthanc does not return PN properly so this is a temporary workaround
    return element.Value[0];
};
