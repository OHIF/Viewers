const worklistContentId = 'worklistTab';
const viewerContentId = 'viewerTab';

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
Template.ohifViewer.onCreated(() => {
    ViewerData = Session.get('ViewerData') || {};
});

Template.ohifViewer.onRendered(() => {
    const templateData = Template.currentData();
    if (templateData && templateData.studyInstanceUid) {
        const studyInstanceUid = templateData.studyInstanceUid;
        openNewTab(studyInstanceUid, studyInstanceUid);
    } else {
        // If there is a tab set as active in the Session,
        // switch to that now.
        const contentId = Session.get('activeContentId');

        // TODO: Fix this it seems to be forcing two switches
        switchToTab(contentId);
    }
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
