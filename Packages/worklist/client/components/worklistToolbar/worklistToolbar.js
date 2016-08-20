import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

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
        const selectedFiles = $.map(event.currentTarget.files, value => value);

        importStudies(selectedFiles);
    },

    'click .js-import-files'(event) {
        // Reset file input
        $(event.currentTarget).val('');
    }
});

Template.worklistToolbar.helpers({
    importSupported() {
        const importSupported = Session.get('importSupported');
        return (importSupported && OHIF.uiSettings.studyListFunctionsEnabled);
    }
});
