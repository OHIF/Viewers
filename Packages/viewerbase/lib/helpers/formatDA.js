UI.registerHelper('formatDA', function (context, format, options) {
    if (!context) {
        return undefined;
    }
    /*var date = DICOMUtilities.toDate(context, '', false);
    if(!date) {
    return context;
    }*/
    var date = context;
    var dateAsMoment = moment(date);
    var strFormat = "MMM D, YYYY";
    if (options) {
        strFormat = format;
    }
    return dateAsMoment.format(strFormat);
});