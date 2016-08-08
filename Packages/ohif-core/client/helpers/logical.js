import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

/**
 * Global Blaze UI helpers to work with logical operations
 */

// Convert any value into a boolean value
Template.registerHelper('bool', value => {
    return !!value;
});

// Check if two values are identical
Template.registerHelper('eq', (a, b) => {
    return a === b;
});

// Check if two values are different
Template.registerHelper('ne', (a, b) => {
    return a !== b;
});

// Check if the first value is greater than the second one
Template.registerHelper('gt', (a, b) => {
    return a > b;
});

// Check if the first value is lesser than the second one
Template.registerHelper('lt', (a, b) => {
    return a < b;
});

// Check if the first value is greater than or equals the second one
Template.registerHelper('gte', (a, b) => {
    return a >= b;
});

// Check if the first value is lesser than or equals the second one
Template.registerHelper('lte', (a, b) => {
    return a <= b;
});

// Get the boolean negation for the given value
Template.registerHelper('not', value => {
    return !value;
});

// Check if all the given values are true
Template.registerHelper('and', (...values) => {
    let result = true;
    _.each(_.initial(values, 1), value => {
        return !value && (result = false);
    });
    return result;
});

// Check if one of the given values is true
Template.registerHelper('or', (...values) => {
    let result = false;
    _.each(_.initial(values, 1), value => {
        return value && (result = true);
    });
    return result;
});

// Return the second parameter if the first is true or the third if it's false
Template.registerHelper('valueIf', (condition, valueIfTrue, valueIfFalse) => {
    if (condition) {
        return valueIfTrue;
    }

    return valueIfFalse;
});
