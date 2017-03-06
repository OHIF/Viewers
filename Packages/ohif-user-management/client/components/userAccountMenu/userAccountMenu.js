import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Router } from 'meteor/iron:router';
import { moment } from 'meteor/momentjs:moment';
import { OHIF } from 'meteor/ohif:core';

// Display the last login modal as default
Session.setDefault('displayLastLoginModal', true);

Template.userAccountMenu.helpers({
    name: function() {
        const nameSplit = Meteor.user().profile.fullName.split(' ');
        const lastName = nameSplit[nameSplit.length - 1];
        nameSplit[nameSplit.length - 1] = lastName.substr(0, 1) + '.';
        return nameSplit.join(' ');
    },

    currentUser: function() {
        const verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

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
    'click #serverInformation'() {
        OHIF.ui.showDialog('serverInformationModal');
    },

    'click #themeSelector'() {
        OHIF.ui.showDialog('themeSelectorModal');
    },

    'click #logoutButton'() {
        Meteor.logout(function() {
            Router.go('/entrySignIn');
        });
    }
});

Template.userAccountMenu.onCreated(function userAccountMenuCreated() {
    const instance = Template.instance();

    // Create reactive last login date
    instance.lastLoginDate = new ReactiveVar();

    // We need oldUser to remove Reviewers if the user logged out
    let oldUser;

    // Get last login date
    Meteor.call('getPriorLoginDate', function(error, lastLoginDate) {
        if (error) {
            OHIF.log.error(error);
            return;
        }

        // Format the last login date
        const formattedLastLoginDate = moment(lastLoginDate).format('MMMM Do YYYY, HH:mm:ss A');

        instance.lastLoginDate.set(formattedLastLoginDate);

    });

    instance.autorun(function() {
        const lastLoginDate = instance.lastLoginDate.get();
        if (!lastLoginDate) {
            return;
        }

        // Hook login/logout
        const user = Meteor.user();
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

        // Display the modal and hide it after 5 seconds
        OHIF.ui.showDialog('lastLoginModal', {
            lastLoginDate,
            timeout: 5000
        }).then(() => Session.setPersistent('displayLastLoginModal', false));

        // Log signin
        HipaaLogger.logEvent({
            eventType: 'init',
            userId: user._id,
            userName: user.profile.fullName
        });

    });
});
