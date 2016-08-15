/**
 * Converts the properties to URL query parameters.  Based on:
 * http://stackoverflow.com/questions/111529/create-query-parameters-in-javascript
 *
 * @param data
 * @returns {string}
 */
encodeQueryData = function(data) {
    var ret = [];

    for (var d in data) {
        if (data[d]) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
        }
    }

    return ret.join('&');
};
