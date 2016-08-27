Template.worklistToolbar.onCreated(() => {
    Meteor.call('importSupported', (error, result) => {
        if (error || !result) {
            Session.set('importSupported', false);
        } else {
            Session.set('importSupported', true);
        }
    });
});

Template.worklistToolbar.events({
    'change .js-import-files'(event) {
        //  Get selected files located in the client machine
        var selectedFiles = $.map(event.currentTarget.files, (value) => {
            return value;
        });
        
        importStudies(selectedFiles);
    },

    'click .js-import-files'(event) {
        // Reset file input
        var fileInput = event.currentTarget;
        $(fileInput).val('');
    }
});

Template.worklistToolbar.helpers({
    importSupported() {
        var importSupported = Session.get('importSupported');
        var studyListFunctionsEnabled = Meteor.settings && Meteor.settings.public && Meteor.settings.public.ui &&
            Meteor.settings.public.ui.studyListFunctionsEnabled || false;

        return (importSupported && studyListFunctionsEnabled);
    }
});