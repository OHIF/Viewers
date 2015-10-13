UI.registerHelper('formatNumberPrecision', function(context, precision, options) {
    if(context) {
        return parseFloat(context).toFixed(precision);
    }
});