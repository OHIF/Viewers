Template.userAccountMenu.helpers({
    name: function() {
        var nameSplit = Meteor.user().profile.fullName.split(' ');
        var lastName = nameSplit[nameSplit.length - 1];
        var lastNameAbbrev = lastName.substr(0, 1) + '.';
        nameSplit[nameSplit.length - 1] = lastNameAbbrev;
        return nameSplit.join(' ');
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

        return !!Meteor.user().emails[0].verified;
    },
    showWorklistMenu: function() {
        var currentPath = Router.current().route.path(this);
        if (currentPath !== '/' && currentPath !== '/worklist') {
            return true;
        }
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
