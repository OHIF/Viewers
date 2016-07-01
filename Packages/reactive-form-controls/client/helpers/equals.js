import { Template } from 'meteor/templating';

/**
 * Compares two variables are equal in value
 *
 * @returns {boolean}
 */
Template.registerHelper('equals', function(a, b) {
    return a === b;
});