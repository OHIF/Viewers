import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers to manipulate data
 */

// Base extend function to be used by extend and clone helpers
const extend = (...argsArray) => {
    // Create the resulting object
    const result = argsArray[0] || {};

    // Extract the Spacebars kw hash
    const lastArg = _.last(argsArray);
    const kwHash = lastArg ? lastArg.hash : null;

    // Extract the given objects
    const objects = _.initial(argsArray);

    // Iterate over the given objects
    _.each(objects, current => {
        // Stop here if the current argument is not an object
        if (typeof current !== 'object') {
            return;
        }

        // Extend the resulting object with the current argument object
        _.extend(result, current);
    });

    // Extend the resulting object with the Spacebars kw hash
    _.extend(result, kwHash);

    // Return the resulting object
    return result;
};

// Extend the first argument object it with the other argument objects
Template.registerHelper('extend', (...argsArray) => {
    return extend(...argsArray);
});

// Create a new object and extends it with the argument objects
Template.registerHelper('clone', (...argsArray) => {
    const newArgs = argsArray.slice();
    newArgs.unshift({});
    return extend(...newArgs);
});

// Choose the first truthy value in the given values
Template.registerHelper('choose', (...values) => {
    let result;
    _.each(_.initial(values, 1), value => {
        if (result) {
            return;
        }

        result = value;
    });
    return result;
});
