import { Blaze } from 'meteor/blaze';

function formatNumberPrecision(number, precision) {
    if (number !== null) {
        return parseFloat(number).toFixed(precision);
    }
}

/**
 * A global Blaze UI helper to format a float value to a specified precision
 */
Blaze.registerHelper('formatNumberPrecision', formatNumberPrecision);

export default formatNumberPrecision;
