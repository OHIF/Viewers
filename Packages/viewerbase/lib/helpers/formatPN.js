UI.registerHelper('formatPN', function (context, format, options) {
    if (!context) {
        return undefined;
    }
    var patientName = context.replace('^', ', ');
    return patientName;
});