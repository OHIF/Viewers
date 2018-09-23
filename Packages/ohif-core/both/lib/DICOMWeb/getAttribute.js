/**
 * Returns the specified element as a dicom attribute group/element.
 *
 * @param element - The group/element of the element (e.g. '00280009')
 * @param [defaultValue] - The value to return if the element is not present
 * @returns {*}
 */
export default function getAttribute(element, defaultValue) {
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

    return convertToInt(element.Value);
};

function convertToInt(input) {
    function padFour(input) {
        var l = input.length;

        if (l == 0) return '0000';
        if (l == 1) return '000' + input;
        if (l == 2) return '00' + input;
        if (l == 3) return '0' + input;

        return input;
    }

    var output = '';
    for (var i = 0; i < input.length; i++) {
        for (var j = 0; j < input[i].length; j++) {
            output += padFour(input[i].charCodeAt(j).toString(16));
        }
    }

    return parseInt(output, 16);
}
