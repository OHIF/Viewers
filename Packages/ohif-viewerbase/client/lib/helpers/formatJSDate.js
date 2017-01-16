import { Blaze } from 'meteor/blaze';
import { moment } from 'meteor/momentjs:moment';

/**
 * A global Blaze UI helper function to format JavaScript Dates using the Moment library
 */
Blaze.registerHelper('formatJSDate', function(context, format, options) {
    if (!context) {
        return;
    }

    var dateAsMoment = moment(new Date(context));
    var strFormat = 'MMM D, YYYY';
    if (options) {
        strFormat = format;
    }

    return dateAsMoment.format(strFormat);
});
