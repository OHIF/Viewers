import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';

/**
 * Helper for retrieving username given userId
 */
Blaze.registerHelper('getUsername', function(userId) {
    var user = Meteor.users.findOne({
        userId: userId
    });

    if (user && user.name) {
        return user.name;
    }
});
