Template.userAccountMenu.helpers({
    fullName: function() {
        return Meteor.user().profile.fullName;
    },
    currentUser: function() {
        var verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

        if (!Meteor.user() || !Meteor.userId()) {
            return false;
        }

        if (!verifyEmail) {
            return true;
        }

        if (!Meteor.user().emails) {
            return true;
        }

        if (Meteor.user().emails[0].verified) {
            return true;
        }

        return false;
    },
    showWorklistMenu: function() {
        var currentPath = Router.current().route.path(this);
        if (currentPath === '/' || currentPath === '/worklist') {
            return false;
        }
        return true;
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