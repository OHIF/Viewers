import { Blaze } from 'meteor/blaze';

/**
 * A global Blaze UI helper to Stringify a JavaScript object
 *
 * Credit to:
 *
 * http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
 */
Blaze.registerHelper('prettyPrintStringify', function(context) {
    if (!context) {
        return;
    }

    var string = JSON.stringify(context, null, 2);
    string = string.replace(/['"]+/g, '');
    string = string.replace('{', '');
    string = string.replace('}', '');
    string = string.replace(',', '\n');
    return string;
});
