Template.worklistStudy.events({
    'click': function () {
        // Use the formatPN template helper to clean up the patient name
        var title = Blaze._globalHelpers['formatPN'](this.patientName);
        openNewTab(this.studyInstanceUid, title);
    }
});

Template.worklistStudy.helpers({
    isTouchDevice: function() {
        return isTouchDevice();
    }
});