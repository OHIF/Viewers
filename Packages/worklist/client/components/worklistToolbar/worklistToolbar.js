Template.worklistToolbar.events({
    'change #btnImport': function(e) {
        //  Get selected files located in the client machine
        var selectedFiles = $.map(e.currentTarget.files, function(value) {
            return value;
        });
        
        importStudies(selectedFiles);
    },

    'click #btnImport': function(e) {
        // Reset file input
        var fileInput = e.currentTarget;
        $(fileInput).val('');
    }
});

Template.worklistToolbar.helpers({
    importSupported: function() {
        var importSupported = Session.get('importSupported');
        var studyListFunctionsEnabled = Meteor.settings && Meteor.settings.public && Meteor.settings.public.ui &&
            Meteor.settings.public.ui.studyListFunctionsEnabled || false;

        return (importSupported && studyListFunctionsEnabled);
    }
});

Meteor.call('importSupported', function(err, result) {
    if (!err && result) {
        Session.set('importSupported', true);
    } else {
        Session.set('importSupported', false);
    }
});
