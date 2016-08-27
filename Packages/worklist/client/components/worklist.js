/**
 * Template: Worklist
 *
 * This is the main component of the Worklist package
 */

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
ViewerData = Session.get('ViewerData') || {};

// Create the WorklistTabs collection
WorklistTabs = new Meteor.Collection(null);
WorklistTabs._debugName = 'WorklistTabs';

// Define the WorklistStudies Collection
// This is a client-side only Collection which
// Stores the list of studies in the Worklist
WorklistStudies = new Meteor.Collection(null);
WorklistStudies._debugName = 'WorklistStudies';

Session.setDefault('activeContentId', 'worklistTab');

Template.worklist.onRendered(() => {
    const instance = Template.instance();
    if (instance.data && instance.data.studyInstanceUid) {
        const studyInstanceUid = instance.data.studyInstanceUid;
        openNewTab(studyInstanceUid, studyInstanceUid);
    } else {
        // If there is a tab set as active in the Session,
        // switch to that now.
        console.log('worklist onRendered');
        const contentId = Session.get('activeContentId');
        if (contentId !== 'worklistTab' && ViewerData && ViewerData[contentId]) {
            switchToTab(contentId);
        }
    }

    Meteor.subscribe('hangingprotocols');
});

Template.worklist.events({
    'click #tablist a[data-toggle="tab"]': function(e) {
        // If this tab is already active, do nothing
        const tabButton = $(e.currentTarget);
        const tabTitle = tabButton.parents('.tabTitle');
        if (tabTitle.hasClass('active')) {
            return;
        }

        // Otherwise, switch to the tab
        const contentId = tabButton.data('target').replace('#', '');
        switchToTab(contentId);
    }
});
