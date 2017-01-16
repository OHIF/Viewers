import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

/**
 * Global Blaze UI helper to sort array elements
 *  by an array element's property (property) or deep object property (property.childProperty)
 * Sorts ascending as default
 */
Template.registerHelper('sort', (array, sortBy, sortType) => {
    if (!sortBy) {
        return array;
    }

    //  To keep the order for the same values of the field which is used to sort:
    //      1. Group the array by the field
    //      2. Sort the grouped array
    //      3. Ungroup the sorted array

    const groupedArray = _.groupBy(array, (element) => {
        if (sortBy) {
            var groupingElement = getKeyValue(element, sortBy);
            if (groupingElement) {
                return groupingElement;
            }
        }
        return element;
    });

    const sortedArray = _.sortBy(groupedArray, (element) => {
        if (sortBy) {
            var sortingElement = getKeyValue(element[0], sortBy);
            if (sortingElement) {
                return sortingElement;
            }
        }
        return element;
    });

    if (sortType === 'desc') {
        return _.flatten(sortedArray.reverse(), true);
    }

    return _.flatten(sortedArray, true);
});

function getKeyValue(object, keyPath) {
    keyPath = keyPath.split('.');
    for (var i = 0; i < keyPath.length; i++) {
        if (object && _.has(object, keyPath[i])) {
            object = object[keyPath[i]];
        }
        else {
            return undefined;
        }
    }
    return object;
}
