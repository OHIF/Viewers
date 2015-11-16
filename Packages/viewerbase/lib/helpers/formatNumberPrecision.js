/**
 * A global Blaze UI helper to format a float value to a specified precision
 */
UI.registerHelper('formatNumberPrecision', function(context, precision) {
    if (context) {
        return parseFloat(context).toFixed(precision);
    }
});