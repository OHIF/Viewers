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
    var contentid = uuid.new();

    // Create a new entry in the WorklistTabs Collection
    WorklistTabs.insert({
        title: title,
        contentid: contentid,
        studyInstanceUid: studyInstanceUid,
        active: false
    });

    // Update the ViewerData global object
    ViewerData[contentid] = {
        title: title,
        contentid: contentid,
        studyInstanceUids: [studyInstanceUid]
    };

    // Switch to the new tab
    switchToTab(contentid);
};
