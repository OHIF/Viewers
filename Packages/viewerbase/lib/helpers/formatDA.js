UI.registerHelper('formatDA', function (context, format, options) {
    if (!context) {
        return undefined;
    }
    var date = context;
    var dateAsMoment = moment(date, "YYYYMMDD");
    var strFormat = "MMM D, YYYY";
    if (options) {
        strFormat = format;
    }
    return dateAsMoment.format(strFormat);
});