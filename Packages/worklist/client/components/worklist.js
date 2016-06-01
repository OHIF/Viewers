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

Template.worklist.onRendered(function() {
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

Template.worklist.helpers({
    /**
     * Returns the current set of Worklist Tabs
     * @returns Meteor.Collection The current state of the WorklistTabs Collection
     */
    worklistTabs: function() {
        return WorklistTabs.find();
    }
});

Template.worklist.events({
    'click #tablist a[data-toggle="tab"]': function(e) {
        // If this tab is already active, do nothing
        var tabButton = $(e.currentTarget);
        var tabTitle = tabButton.parents('.tabTitle');
        if (tabTitle.hasClass('active')) {
            return;
        }

        // Otherwise, switch to the tab
        var contentId = tabButton.data('target').replace('#', '');
        switchToTab(contentId);
    }
});
