import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

// Display the last login modal as default
Session.setDefault('displayLastLoginModal', true);

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
        Meteor.logout(function() {
            Router.go('/entrySignIn');
        });
    }
});

Template.userAccountMenu.onCreated(function userAccountMenuCreated() {
    const instance =  Template.instance();

    // Create reactive last login date
    instance.lastLoginDate = new ReactiveVar();

    // We need oldUser to remove Reviewers if the user logged out
    let oldUser;

    // Get last login date
    Meteor.call('getPriorLoginDate', function(error, lastLoginDate){
        if (error) {
            console.log(error);
            return;
        }

        // Format the last login date
        const formattedLastLoginDate = moment(lastLoginDate).format("MMMM Do YYYY, HH:mm:ss A");

        instance.lastLoginDate.set(formattedLastLoginDate);

    });

    instance.autorun(function() {
        const lastLoginDate = instance.lastLoginDate.get();
        if (!lastLoginDate) {
            return;
        }

        // Hook login/logout
        var user = Meteor.user();
        if (!user) {
            // Display last login modal for the next login
            Session.setPersistent('displayLastLoginModal', true);

            if (oldUser) {
                // Log Signout
                // TODO: eventType for logout is not defined
                // HipaaLogger.logEvent({
                //     eventType: 'logout',
                //     userId: oldUser._id,
                //     userName: oldUser.profile.fullName
                //  });

                // Remove the user by oldUserId from Reviewers
                Meteor.call('removeUserFromReviewers', oldUser._id);
            }
            return;
        }

        // Set oldUser
        oldUser = user;

        // Trigger last login date popup
        if (!Session.get('displayLastLoginModal')) {
            return;
        }

        // Displaye the modal
        Modal.show('lastLoginModal', {
            lastLoginDate: lastLoginDate
        });

        // Hide the modal after 5sec
        Meteor.setTimeout(() => {
            Modal.hide('lastLoginModal');
            Session.setPersistent('displayLastLoginModal', false);
        }, 5000);

        // Log signin
        HipaaLogger.logEvent({
            eventType: 'init',
            userId: user._id,
            userName: user.profile.fullName
        });

    });
});