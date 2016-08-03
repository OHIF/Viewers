import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

OHIF.string = {};

// Search for some string inside any object or array
OHIF.string.search = (object, query, property=null, result=[]) => {
    // Create the search pattern
    const pattern = new RegExp($.trim(query).replace(/\s/gi, '|'), 'i');

    _.each(object, item => {
        // Stop here if item is empty
        if (!item) {
            return;
        }

        // Get the value to be compared
        const value = _.isString(property) ? item[property] : item;

        // Check if the value match the pattern
        if (_.isString(value) && pattern.test(value)) {
            // Add the current item to the result
            result.push(item);
        } else if (_.isObject(value)) {
            // Search recursively the item if the current item is an object
            OHIF.string.search(value, query, property, result);
        }
    });

    // Return the found items
    return result;
};
