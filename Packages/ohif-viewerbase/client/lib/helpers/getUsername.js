/**
 * Helper for retrieving username given userId
 */
UI.registerHelper('getUsername', function(userId) {
    var user = Meteor.users.findOne({
        userId: userId
    });

    if (user && user.name) {
        return user.name;
    }
});
