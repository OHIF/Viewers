/**
 * Helper for setting checkboxes as checked or unchecked inside templates,
 * based on another variable's value
 */
UI.registerHelper("inlineIf", function (value, match, attributeName) {
    if(value === match) {
        return attributeName;
    }
    return '';
});