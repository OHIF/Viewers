// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
ViewerData = Session.get('ViewerData') || {};

Template.lesionTracker.onCreated(function() {
    // showViewer to go to viewer from audit
    this.showWorklistMenu = new ReactiveVar(true);
    // Get url and check worklist
    var currentRoute = Router.current();
    if (!currentRoute || !currentRoute.route) {
        return;
    }

    var currentPath = currentRoute.route.path(this);
    if (currentPath === '/' || currentPath === '/worklist') {
        this.showWorklistMenu.set(false);
    }
});

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
        var worklistContentId = 'worklistTab';
        var viewerContentId = 'viewerTab';

        if (contentId !== worklistContentId) {
            switchToTab(worklistContentId);
        } else {
            switchToTab(viewerContentId);
        }
    }
});

Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');

Template.lesionTracker.helpers({
    showWorklistMenu: function() {
        return Template.instance().showWorklistMenu.get();
    },
    studyListToggleText: function() {
        var contentId = Session.get('activeContentId');
        if (!contentId) {
            return;
        }

        var worklistContentId = 'worklistTab';
        var viewerContentId = 'viewerTab';

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
