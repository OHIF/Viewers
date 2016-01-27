Template.layoutLesionTracker.events({
    'click #logoutButton': function() {
        Meteor.logout(function(){
            Router.go('/entrySignIn');
        });
    }
});

Template.layoutLesionTracker.helpers({
    'fullName': function() {
        return Meteor.user().profile.fullName;
    }
});
