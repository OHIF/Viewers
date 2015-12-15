/**
 * Template: Worklist
 *
 * This is the main component of the Worklist package
 */

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
ViewerData = Session.get('ViewerData') || {};

// Define the StudyMetaData object. This is used as a cache
// to store study meta data information to prevent unnecessary
// calls to the server
var StudyMetaData = {};

// Create the WorklistTabs collection
WorklistTabs = new Meteor.Collection(null);

// Create the WorklistStudies collection
WorklistStudies = new Meteor.Collection(null);

/**
* Retrieves study metadata using a server call, and fires a callback
* when completed.
*
* @params {string} studyInstanceUid The UID of the Study to be retrieved
* @params {function} doneCallback The callback function to be executed when the study retrieval has finished
*/
getStudyMetadata = function(studyInstanceUid, doneCallback) {
    log.info('worklistStudy getStudyMetadata');

    // If the StudyMetaData cache already has data related to this
    // studyInstanceUid, then we should fire the doneCallback with this data
    // and stop here.
    var study = StudyMetaData[studyInstanceUid];
    if (study) {
        doneCallback(study);
        return;
    }

    // If no study metadata is in the cache variable, we need to retrieve it from
    // the server with a call.
    Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
        if (error) {
            log.warn(error);
            return;
        }
        // Once we have retrieved the data, we sort the series' by series
        // and instance number in ascending order
        sortStudy(study);

        // Then we store this data in the cache variable
        StudyMetaData[studyInstanceUid] = study;

        // Finally, we fire the doneCallback with this study meta data
        doneCallback(study);
    });
};

/**
 *  Switches to a new tab in the tabbed worklist container
 *  This function renders either the Worklist or the Viewer template with new data.
 *
 * @param contentId The unique ID of the tab to be switched to
 */
switchToTab = function(contentId) {
    log.info("Switching to tab: " + contentId);

    // Use Bootstrap's Tab JavaScript to show the contents of the current tab
    // Unless it is the worklist, it is currently an empty div
    $('.tabTitle a[data-target="#' + contentId + '"]').tab('show');

    // Remove any previous Viewers from the DOM
    $("#viewer").remove();

    // Update the 'activeContentId' variable in Session
    Session.set("activeContentId", contentId);

    // If we are switching to the Worklist tab, reset any CSS styles
    // that have been applied to prevent scrolling in the Viewer.
    // Then stop here, since nothing needs to be re-rendered.
    if (contentId === 'worklistTab') {
        document.body.style.overflow = null;
        document.body.style.height = null;
        document.body.style.minWidth = null;
        document.body.style.position = null;
        return;
    }

    // Get tab content container given the contentId string
    // If no such container exists, stop here because something is wrong
    var container = $('.tab-content').find("#" + contentId).get(0);
    if (!container) {
        log.warn('No container present with the contentId: ' + contentId);
        return;
    }

    // Use the stored ViewerData global object to retrieve the studyInstanceUid
    // related to this tab
    var studyInstanceUid = ViewerData[contentId].studyInstanceUid;

    // Attempt to retrieve the meta data (it might be cached)
    getStudyMetadata(studyInstanceUid, function(study) {

        // Once we have the study data, store it in a structure with
        // any other saved data about this tab (e.g. layout structure)
        var data = {
            viewportRows: ViewerData[contentId].viewportRows,
            viewportColumns: ViewerData[contentId].viewportColumns,
            contentId: contentId,
            studies: [study]
        };

        if (ViewerData[contentId].studies && ViewerData[contentId].studies.length) {
            data.studies = ViewerData[contentId].studies;
        }

        // Remove the loading text template that is inside the tab container by default
        container.innerHTML = "";

        // Use Blaze to render the Viewer Template into the container
        UI.renderWithData(Template.viewer, data, container);

        // Retrieve the DOM element of the viewer
        var imageViewer = $("#viewer");

        // If it is present in the DOM (it should be), then apply
        // styles to prevent page scrolling and overscrolling on mobile devices
        if (imageViewer) {
            document.body.style.overflow = "hidden";
            document.body.style.height = '100%';
            document.body.style.width = '100%';
            document.body.style.minWidth = 0;
            document.body.style.position = 'fixed'; // Prevent overscroll on mobile devices
        }
    });
};

/**
 * Opens a new tab in the tabbed worklist environment using
 * a given study and new tab title.
 *
 * @param studyInstanceUid The UID of the Study to be opened
 * @param title The title to be used for the tab heading
 */
openNewTab = function(studyInstanceUid, title) {
    // Generate a unique ID to represent this tab
    // We can't just use the Mongo entry ID because
    // then it will change after hot-reloading.
    var contentid = generateUUID();

    // Create a new entry in the WorklistTabs Collection
    WorklistTabs.insert({
        title: title,
        contentid: contentid,
        active: false
    });

    // Update the ViewerData global object
    ViewerData[contentid] = {
        title: title,
        contentid: contentid,
        studyInstanceUid: studyInstanceUid
    };

    // Switch to the new tab
    switchToTab(contentid);
};

Template.worklist.onRendered(function() {
    // If there is a tab set as active in the Session,
    // switch to that now.
    var contentId = Session.get("activeContentId");
    if (contentId) {
        switchToTab(contentId);
    }
});


Template.worklist.helpers({
    /**
     * Returns the current set of Worklist Tabs
     * @returns Meteor.Collection The current state of the WorklistTabs Collection
     */
    'worklistTabs': function() {
        return WorklistTabs.find();
    }
});

Template.worklist.events({
    'click #tablist a[data-toggle="tab"]': function(e) {
        // If this tab is already active, do nothing
        var tabButton = $(e.currentTarget);
        var tabTitle = tabButton.parents('.tabTitle');
        if (tabTitle.hasClass("active")) {
            return;
        }

        // Otherwise, switch to the tab
        var contentId = tabButton.data('target').replace("#", "");
        switchToTab(contentId);
    }
});