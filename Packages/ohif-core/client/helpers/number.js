import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers to work with numeric operations
 */

// Sum all the given numbers
Template.registerHelper('sum', (...values) => {
    let result = 0;
    _.each(_.initial(values, 1), value => (result += (value | 0)));
    return result;
});
