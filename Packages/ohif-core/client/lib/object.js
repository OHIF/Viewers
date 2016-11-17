import { OHIF } from 'meteor/ohif:core';

OHIF.object = {};

// Transforms a shallow object with keys separated by "." into a nested object
OHIF.object.getNestedObject = shallowObject => {
    var nestedObject = {};
    for (var key in shallowObject) {
        var value = shallowObject[key];
        var propertyArray = key.split('.');
        var currentObject = nestedObject;
        while (propertyArray.length) {
            var currentProperty = propertyArray.shift();
            if (!propertyArray.length) {
                currentObject[currentProperty] = value;
            } else {
                if (!currentObject[currentProperty]) {
                    currentObject[currentProperty] = {};
                }

                currentObject = currentObject[currentProperty];
            }
        }
    }

    return nestedObject;
};

// Transforms a nested object into a shallowObject merging its keys with "." character
OHIF.object.getShallowObject = nestedObject => {
    var shallowObject = {};
    var putValues = function(baseKey, nestedObject, resultObject) {
        for (var key in nestedObject) {
            var currentKey = baseKey ? baseKey + '.' + key : key;
            var currentValue = nestedObject[key];
            if (typeof currentValue === 'object') {
                if (currentValue instanceof Array) {
                    currentKey += '[]';
                }

                putValues(currentKey, currentValue, resultObject);
            } else {
                resultObject[currentKey] = currentValue;
            }
        }
    };

    putValues('', nestedObject, shallowObject);
    return shallowObject;
};
