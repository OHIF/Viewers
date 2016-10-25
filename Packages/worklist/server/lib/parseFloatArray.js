export const parseFloatArray = function(obj) {
    var result = [];

    if (!obj) {
        return result;
    }

    var objs = obj.split("\\");
    for (var i = 0; i < objs.length; i++) {
        result.push(parseFloat(objs[i]));
    }

    return result;
};
