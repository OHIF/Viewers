Template.userAccountMenu.helpers({
    name: function() {
        var nameSplit = Meteor.user().profile.fullName.split(' ');
        var lastName = nameSplit[nameSplit.length - 1];
        nameSplit[nameSplit.length - 1] = lastName.substr(0, 1) + '.';
        return nameSplit.join(' ');
    },
    currentUser: function() {
        var verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

        if (!Meteor.user() || !Meteor.userId()) {
            return;
        }

        if (!verifyEmail) {
            return true;
        }

        if (!Meteor.user().emails) {
            return true;
        }

        return !!Meteor.user().emails[0].verified;
    }
});

Template.userAccountMenu.events({
    'click #serverInformation': function() {
        $('#serverInformationModal').modal('show');
    },
    'click #logoutButton': function() {
        // Remove reviewers info for the user
        Meteor.call('removeUserFromReviewers', Meteor.userId());

        Meteor.logout(function() {
            Router.go('/entrySignIn');
        });
    }
});

Template.userAccountMenu.onRendered(function() {
    var oldUserId;
    var lastLoginModalInterval;

    this.autorun(function() {
        // Hook login/logout
        var user = Meteor.user();
        var newUserId = user._id;

        if (oldUserId === null && newUserId) {
            Session.set('showLastLoginModal', true);

            // Log
            HipaaLogger.logEvent({
                eventType: 'init',
                userId: user._id,
                userName: user.fullName
            });

        } else if (newUserId === null && oldUserId) {
            // Set showLastLoginModal as null
            Session.set('showLastLoginModal', null);

            // Destroy interval for last login modal
            Meteor.clearInterval(lastLoginModalInterval);
            console.log('The user logged out');

            // Log
            // TODO: eventType is not defined for logout in hipaa-audit-log
            /*HipaaLogger.logEvent({
             eventType: 'logout',
             userId: oldUserId,
             userName: userName
             });*/

            // Remove the user from Reviewers
            Meteor.call('removeUserFromReviewers', oldUserId);
        }

        oldUserId = Meteor.userId();

        // Trigger last login date popup
        if (Session.get('showLastLoginModal')) {
            Modal.show('lastLoginModal');

            lastLoginModalInterval = Meteor.setInterval(function() {
                Modal.hide('lastLoginModal');
                Session.set('showLastLoginModal', null);
            }, 3000);
        }
    });
});