Template.userAccountMenu.helpers({
    fullName: function() {
        return Meteor.user().profile.fullName;
    },

    showWorklistMenu: function() {
        return  Template.instance().showWorklistMenu.get();
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
    }
});

Template.userAccountMenu.onCreated(function() {
    // showViewer to go to viewer from audit
    this.showWorklistMenu = new ReactiveVar(false);
    // Get url and check worklist
    var currentPath = Router.current().route.path(this);
    if (currentPath === '/audit' || currentPath === '/changePassword') {
        this.showWorklistMenu.set(true);
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
    },
    'click #worklist': function(e, template) {
        template.showWorklistMenu.set(false);
    },
    'click #audit': function(e, template) {
        template.showWorklistMenu.set(true);
    },
    'click #changePassword': function(e, template) {
        template.showWorklistMenu.set(true);
    }
});