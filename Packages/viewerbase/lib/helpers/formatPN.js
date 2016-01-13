/**
 * Formats a patient name for display purposes
 */
formatPN = function(context) {
    if (!context) {
        return;
    }
    return context.replace('^', ', ');
};

/**
 * A global Blaze UI helper to format a patient name for display purposes
 */
UI.registerHelper('formatPN', formatPN);