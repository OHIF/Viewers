import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

OHIF.string = {};

// Search for some string inside any object or array
OHIF.string.search = (object, query, property=null, result=[]) => {
    // Create the search pattern
    const pattern = new RegExp($.trim(query), 'i');

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
        }

        if (_.isObject(item)) {
            // Search recursively the item if the current item is an object
            OHIF.string.search(item, query, property, result);
        }
    });

    // Return the found items
    return result;
};

// Encode any string into a safe format for HTML id attribute
OHIF.string.encodeId = input => {
    const string = input && input.toString ? input.toString() : input;

    // Return an underscore if the given string is empty or if it's not a string
    if (string === '' || typeof string !== 'string') {
        return '_';
    }

    // Create a converter to replace non accepted chars
    const converter = match => '_' + match[0].charCodeAt(0).toString(16) + '_';

    // Encode the given string and return it
    return string.replace(/[^a-zA-Z0-9-]/g, converter);
};
