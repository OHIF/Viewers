/**
 * A global Blaze UI helper function to format JavaScript Dates using the Moment library
 */
UI.registerHelper('jsDateFromNow', function(context, format, options) {
    if (!context) {
        return;
    }

    Session.get('timeAgoVariable');
    
    var dateAsMoment = moment(new Date(context));
    return dateAsMoment.fromNow();
});
