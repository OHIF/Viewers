/**
 * Helper for checking datatype of a variable
 */
UI.registerHelper('ifTypeIs', function(value, match, attributeName) {
    if (typeof(value) === match) {
        return attributeName;
    }

    return '';
});
