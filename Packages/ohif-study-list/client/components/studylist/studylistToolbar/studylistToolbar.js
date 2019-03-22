import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Router } from 'meteor/clinical:router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

Template.studylistToolbar.onCreated(() => {
    Meteor.call('importSupported', (error, result) => {
        if (error || !result) {
            Session.set('importSupported', false);
        } else {
            Session.set('importSupported', true);
        }
    });
});

Template.studylistToolbar.events({
    'change .js-import-files'(event) {
        //  Get selected files located in the client machine
        const selectedFiles = $.map(event.currentTarget.files, value => value);

        OHIF.studylist.importStudies(selectedFiles);
    },

    'click .js-import-files'(event) {
        // Reset file input
        $(event.currentTarget).val('');
    },

    'click .uploadStudiesBtn'() {
        OHIF.gcloud.showUploadStudiesDialog();
    },

    'click .changeDicomStoreBtn'() {
        OHIF.gcloud.showDicomStorePicker({canClose:true}).then(config => {
            if (!config)
                return;
            Session.set("IsStudyListReady", false);
            OHIF.studylist.collections.Studies.remove({});
            OHIF.servers.applyCloudServerConfig(config);
            setImmediate(() => Session.set("IsStudyListReady", true));
        });
    }
});

Template.studylistToolbar.helpers({
    importSupported() {
        const importSupported = Session.get('importSupported');
        return (importSupported && OHIF.uiSettings.studyListFunctionsEnabled);
    },
    uploadSupported() {
        return !!(OHIF.gcloud && OHIF.gcloud.isEnabled());
    },
    changeDicomStoreSupported() {
        return !!(OHIF.gcloud && OHIF.gcloud.isEnabled());
    }
});
