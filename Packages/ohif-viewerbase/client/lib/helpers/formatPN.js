import { Blaze } from 'meteor/blaze';
/**
 * Formats a patient name for display purposes
 */
const formatPN = context => {
    if (!context) {
        return;
    }
    return context.replace('^', ', ');
};

/**
 * A global Blaze UI helper to format a patient name for display purposes
 */
Blaze.registerHelper('formatPN', formatPN);

export { formatPN };
