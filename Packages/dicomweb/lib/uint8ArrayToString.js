/**
 * Converts a Uint8 array to a string
 * @param data
 * @param offset
 * @param length
 * @returns {string}
 */
uint8ArrayToString = function(data, offset, length) {
    offset = offset || 0;
    length = length || data.length - offset;
    var str = "";

    for(var i=offset; i < offset + length; i++) {
        str += String.fromCharCode(data[i]);
    }
    return str;
};
