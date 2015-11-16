/**
 * A global Blaze UI helper function to format DICOM Dates using the Moment library
 */
UI.registerHelper('formatDA', function (context, format, options) {
    if (!context) {
        return undefined;
    }
    var dateAsMoment = moment(context, "YYYYMMDD");
    var strFormat = "MMM D, YYYY";
    if (options) {
        strFormat = format;
    }
    return dateAsMoment.format(strFormat);
});