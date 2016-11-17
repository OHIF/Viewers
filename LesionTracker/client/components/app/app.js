import { OHIF } from 'meteor/ohif:core';

const studylistContentId = 'studylistTab';
const viewerContentId = 'viewerTab';

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
Template.app.onCreated(() => {
    ViewerData = Session.get('ViewerData') || {};
});

Template.app.onRendered(() => {
    const contentId = Session.get('activeContentId');
    if(contentId === viewerContentId) {
        switchToTab(contentId);
    }
});

Template.app.events({
    'click .js-toggle-studyList'() {
        const contentId = Session.get('activeContentId');

        OHIF.ui.unsavedChanges.checkBeforeAction('viewer.*', function(shouldProceed, hasChanges) {
            if (shouldProceed) {
                // Drop signaled unsaved changes if any...
                if (hasChanges) {
                    OHIF.ui.unsavedChanges.clear('viewer.*');
                }

                if (contentId !== studylistContentId) {
                    switchToTab(studylistContentId);
                } else {
                    switchToTab(viewerContentId);
                }
            }
        });

    }
});

Template.app.helpers({
    studyListToggleText() {
        const contentId = Session.get('activeContentId');
        
        // If the Viewer has not been opened yet, 'Back to viewer' should
        // not be displayed
        const viewerContentExists = !!Object.keys(ViewerData).length;
        if (!viewerContentExists) {
            return;
        }

        if (contentId === studylistContentId) {
            return 'Back to viewer';
        } else if (contentId === viewerContentId) {
            return 'Study list';
        }
    },

    onStudyList() {
        return (Session.get('activeContentId') === 'studylistTab');
    },

    dasherize(text) {
        return text.replace(/ /g, '-').toLowerCase();
    }
});

Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');