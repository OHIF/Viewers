/**
 * Converts a String to a UInt8 array of character codes
 * @param {String} str Input string
 * @returns {Uint8Array} Uint8 Array of character codes
 */
function stringToUint8Array(str) {
    var uint = new Uint8Array(str.length);
    for (var i = 0,j = str.length;i< j;i++){
        uint[i] = str.charCodeAt(i);
    }

    return uint;
}

function checkToken(token, data, dataOffset) {
    if (dataOffset + token.length > data.length) {
        //console.log('dataOffset >> ', dataOffset);
        return false;
    }

    for (var i = 0; i < token.length; i++) {
        if (token[i] !== data[endIndex++]) {
            if (endIndex > 520000) {
                console.log('token=',uint8ArrayToString(token));
                console.log('data=', uint8ArrayToString(data, dataOffset, endIndex - dataOffset));
                console.log('miss at %d %s dataOffset=%d', i, String.fromCharCode(data[endIndex]), endIndex);
                console.log('miss at %d %s dataOffset=%d', i, String.fromCharCode(token[endIndex]), endIndex);
            }

            return false;
        }
    }

    return true;
}

findIndexOfString = function(data, str, offset) {
    offset = offset || 0;

    var token = stringToUint8Array(str);

    for (var i = offset; i < data.length; i++) {
        if (data[i] === token[0]) {
            //console.log('match @', i);
            if (checkToken(token, data, i)) {
                return i;
            }
        }
    }

    return -1;
};
