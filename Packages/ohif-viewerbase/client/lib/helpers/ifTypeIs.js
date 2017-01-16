import { Blaze } from 'meteor/blaze';

/**
 * Helper for checking datatype of a variable
 */
Blaze.registerHelper('ifTypeIs', function(value, match, attributeName) {
    if (typeof(value) === match) {
        return attributeName;
    }

    return '';
});
