import { Blaze } from 'meteor/blaze';

/**
 * A global Blaze UI helper to format a float value to a specified precision
 */
Blaze.registerHelper('formatNumberPrecision', function(context, precision) {
    if (context != null) {
        return parseFloat(context).toFixed(precision);
    }
});
