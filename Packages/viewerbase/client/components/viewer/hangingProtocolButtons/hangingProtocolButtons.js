Template.hangingProtocolButtons.helpers({
    isNextAvailable: function() {
        var presentationGroup = Session.get('WindowManagerPresentationGroup');
        var numPresentationGroups = Session.get('WindowManagerNumPresentationGroups');
        return presentationGroup < numPresentationGroups;
    },
    isPreviousAvailable: function() {
        var presentationGroup = Session.get('WindowManagerPresentationGroup');
        return presentationGroup > 1;
    }
});

Template.hangingProtocolButtons.events({
    'click #previousPresentationGroup': function(e) {
        $(e.currentTarget).tooltip('hide');
        WindowManager.previousPresentationGroup();
    },
    'click #nextPresentationGroup': function(e) {
        $(e.currentTarget).tooltip('hide');
        WindowManager.nextPresentationGroup();
    }
});