const worklistContentId = 'worklistTab';
const viewerContentId = 'viewerTab';

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
Template.ohifViewer.onCreated(() => {
    ViewerData = Session.get('ViewerData') || {};
});

Template.ohifViewer.events({
    'click .js-toggle-studyList'() {
        const contentId = Session.get('activeContentId');

        if (contentId !== worklistContentId) {
            switchToTab(worklistContentId);
        } else {
            switchToTab(viewerContentId);
        }
    }
});

Template.ohifViewer.helpers({
    studyListToggleText() {
        const contentId = Session.get('activeContentId');

        // If the Viewer has not been opened yet, 'Back to viewer' should
        // not be displayed
        const viewerContentExists = !!Object.keys(ViewerData).length;
        if (!viewerContentExists) {
            return;
        }

        if (contentId === worklistContentId) {
            return 'Back to viewer';
        } else {
            return 'Study list';
        }
    },
    
    onStudyList() {
        return (Session.get('activeContentId') === 'worklistTab');
    }
});
