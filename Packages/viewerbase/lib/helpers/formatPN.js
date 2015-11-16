/**
 * A global Blaze UI helper to format a patient name for display purposes
 */
UI.registerHelper('formatPN', function (context) {
    if (!context) {
        return undefined;
    }
    return context.replace('^', ', ');
});