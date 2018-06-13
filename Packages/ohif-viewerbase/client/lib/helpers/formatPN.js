import { Blaze } from 'meteor/blaze';
/**
 * Formats a patient name for display purposes
 */
const formatPN = context => {
    if (!context) {
        return;
    }

    // Convert the first ^ to a ', '. String.replace() only affects
    // the first appearance of the character.
    const commaBetweenFirstAndLast = context.replace('^', ', ');

    // Replace any remaining '^' characters with spaces
    const cleaned = commaBetweenFirstAndLast.replace(/\^/g, ' ');

    // Trim any extraneous whitespace
    return cleaned.trim();
};

/**
 * A global Blaze UI helper to format a patient name for display purposes
 */

// Check if global helper already exists to not override it
if (!Blaze._getGlobalHelper('formatPN')) {
    Blaze.registerHelper('formatPN', formatPN);
}

export { formatPN };
