Template.hangingProtocolButtons.helpers({
    isNextAvailable: function() {
        var presentationGroup = Session.get('WindowManagerPresentationGroup');
        var numPresentationGroups = WindowManager.getNumPresentationGroups();
        return presentationGroup < numPresentationGroups;
    },
    isPreviousAvailable: function() {
        var presentationGroup = Session.get('WindowManagerPresentationGroup');
        return presentationGroup > 1;
    }
});
