Template.worklistToolbar.events({
    'change #btnImport': function(e) {
        //  Get selected files located in the client machine
        var selectedFiles = $.map(e.currentTarget.files, function(value) {
            return value;
        });
        
        importStudies(selectedFiles);
    }
});

Template.worklistToolbar.helpers({
    importSupported: function() {
        var importSupported = Session.get('importSupported');
        if (importSupported) {
            return true;
        }
        return false;
    }
});

Meteor.call("importSupported", function(err, result) {
    if (!err && result) {
        Session.set('importSupported', true);
    } else {
        Session.set('importSupported', false);
    }
});