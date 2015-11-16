/**
 * A global Blaze UI helper to format a DICOM Time for display using the Moment library
 */
UI.registerHelper('formatTM', function(context, format) {
    if (!context) {
        return undefined;
    }
    var dateAsMoment = moment(context);
    var strFormat = "HH:mm:ss";
    if (options) {
        strFormat = format;
    }
    return dateAsMoment.format(strFormat);
});
