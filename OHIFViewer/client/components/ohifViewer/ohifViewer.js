import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

const studylistContentId = 'studylistTab';
let lastContentId;

Template.ohifViewer.events({
    'click .js-toggle-studyList'() {
        const contentId = Session.get('activeContentId');

        if (contentId !== studylistContentId) {
            switchToTab(studylistContentId);
        } else {
            switchToTab(lastContentId);
        }
    },

    'click #serverInformation'() {
        OHIF.ui.showDialog('serverInformationModal');
    }
});

Template.ohifViewer.helpers({
    studyListToggleText() {
        const contentId = Session.get('activeContentId');

        // If the Viewer has not been opened yet, 'Back to viewer' should
        // not be displayed
        const viewerContentExists = !!Object.keys(OHIF.viewer.data).length;
        if (!viewerContentExists) {
            return;
        }

        if (contentId === studylistContentId) {
            return 'Back to viewer';
        } else {
            lastContentId = contentId;
            return 'Study list';
        }
    },

    onStudyList() {
        return (Session.get('activeContentId') === 'studylistTab');
    }
});
