/**
 * Template: StudyList
 *
 * This is the main component of the StudyList package
 */

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
ViewerData = Session.get('ViewerData') || {};

// Define the StudyListStudies Collection
// This is a client-side only Collection which
// Stores the list of studies in the StudyList
StudyListStudies = new Meteor.Collection(null);
StudyListStudies._debugName = 'StudyListStudies';

Session.setDefault('activeContentId', 'studylistTab');

Template.studylist.onCreated(() => {
    const instance = Template.instance();
    
    if (StudyList.subscriptions) {
        StudyList.subscriptions.forEach(subscriptionName => {
            instance.subscribe(subscriptionName);
        });
    }
});

Template.studylist.onRendered(() => {
    const instance = Template.instance();
    if (instance.data && instance.data.studyInstanceUid) {
        const studyInstanceUid = instance.data.studyInstanceUid;
        openNewTab(studyInstanceUid, studyInstanceUid);
    } else {
        // If there is a tab set as active in the Session,
        // switch to that now.
        console.log('studylist onRendered');
        const contentId = Session.get('activeContentId');
        if (contentId !== 'studylistTab' && ViewerData && ViewerData[contentId]) {
            switchToTab(contentId);
        }
    }

    Meteor.subscribe('hangingprotocols');
});

Template.studylist.events({
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
