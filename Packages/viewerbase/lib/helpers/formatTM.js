UI.registerHelper('formatTM', function(context, format, options) {
    if (!context) {
        return undefined;
    }
    var date = context;
    var dateAsMoment = moment(date);
    var strFormat = "HH:mm:ss";
    if (options) {
        strFormat = format;
    }

    return dateAsMoment.format(strFormat);
});
