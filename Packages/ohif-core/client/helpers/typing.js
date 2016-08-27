import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers to work with Strings
 */

// Check if the value's type is undefined
Template.registerHelper('isUndefined', value => {
    return _.isUndefined(value);
});

// Check if the value's type is object
Template.registerHelper('isObject', value => {
    return _.isObject(value);
});

// Check if the value is an array instance
Template.registerHelper('isArray', value => {
    return _.isArray(value);
});
