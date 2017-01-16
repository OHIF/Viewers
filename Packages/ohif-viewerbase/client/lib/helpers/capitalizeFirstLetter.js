import { Blaze } from 'meteor/blaze';

/**
 * A global Blaze UI helper to capitalizes the first letter of an input String
 *
 * Credit to:
 *
 * http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
 */
Blaze.registerHelper('capitalizeFirstLetter', function (context) {
    if (!context) {
        return;
    }

    return context.charAt(0).toUpperCase() + context.slice(1);
});
