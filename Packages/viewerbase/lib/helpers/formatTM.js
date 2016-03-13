/**
 * A global Blaze UI helper to format a DICOM Time for display using the Moment library
 */
UI.registerHelper('formatTM', function(context, options) {
    if (!context) {
        return;
    }

    // DICOM Time is stored as HHmmss.SSS, where: 
    //      HH 24 hour time:
    //      m mm    0..59   Minutes
    //      s ss    0..59   Seconds
    //      S SS SSS    0..999  Fractional seconds
    //
    // See MomentJS: http://momentjs.com/docs/#/parsing/string-format/
    var dateTime = moment(context, 'HHmmss.SSS');

    var format = "HH:mm:ss";
    if (options && options.format) {
        format = options.format;
    }

    return dateTime.format(format);
});
