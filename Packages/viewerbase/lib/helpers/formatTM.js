/**
 * A global Blaze UI helper to format a DICOM Time for display using the Moment library
 */
UI.registerHelper('formatTM', function(context, format) {
    if (!context) {
        return;
    }

    var dateTime = moment(context);
    return dateTime.format(format || "HH:mm:ss");
});
