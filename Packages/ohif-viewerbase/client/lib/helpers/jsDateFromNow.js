import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { moment } from 'meteor/momentjs:moment';

/**
 * A global Blaze UI helper function to format JavaScript Dates using the Moment library
 */
Blaze.registerHelper('jsDateFromNow', function(context, format, options) {
    if (!context) {
        return;
    }

    Session.get('timeAgoVariable');
    
    var dateAsMoment = moment(new Date(context));
    return dateAsMoment.fromNow();
});
