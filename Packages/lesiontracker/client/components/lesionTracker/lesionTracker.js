// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
ViewerData = Session.get('ViewerData') || {};

var worklistContentId = 'worklistTab';
var viewerContentId = 'viewerTab';

Template.lesionTracker.onRendered(function() {
    var templateData = Template.currentData();
    if (templateData && templateData.studyInstanceUid) {
        var studyInstanceUid = templateData.studyInstanceUid;
        openNewTab(studyInstanceUid, studyInstanceUid);
    } else {
        // If there is a tab set as active in the Session,
        // switch to that now.
        var contentId = Session.get('activeContentId');

        // TODO: FIx this it seems to be forcing two switches
        switchToTab(contentId);
    }

    Meteor.subscribe('hangingprotocols');
});

Template.lesionTracker.events({
    'click .js-toggle-studyList': function() {
        var contentId = Session.get('activeContentId');

        if (contentId !== worklistContentId) {
            switchToTab(worklistContentId);
        } else {
            switchToTab(viewerContentId);
        }
    }
});

Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');

Template.lesionTracker.helpers({
    studyListToggleText: function() {
        var contentId = Session.get('activeContentId');
        
        // If the Viewer has not been opened yet, 'Back to viewer' should
        // not be displayed
        var viewerContentExists = !!Object.keys(ViewerData).length;
        if (!viewerContentExists) {
            return;
        }

        if (contentId === worklistContentId) {
            return 'Back to viewer';
        } else if (contentId === viewerContentId) {
            return 'Study list';
        }
    },
    onStudyList: function() {
        return (Session.get('activeContentId') === 'worklistTab');
    }
});
