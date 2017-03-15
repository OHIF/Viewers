import { Random } from 'meteor/random';
import { OHIF } from 'meteor/ohif:core';

/**
 * Opens a new tab in the tabbed studylist environment using
 * a given study and new tab title.
 *
 * @param studyInstanceUid The UID of the Study to be opened
 */
const openNewTab = studyInstanceUid => {
    OHIF.log.info('openNewTab');

    // Generate a unique ID to represent this tab
    // We can't just use the Mongo entry ID because
    // then it will change after hot-reloading.
    const contentId = Random.id();

    // Update the ViewerData global object
    ViewerData = window.ViewerData || ViewerData;
    ViewerData[contentId] = {
        contentId: contentId,
        studyInstanceUids: [studyInstanceUid]
    };

    // Switch to the new tab
    switchToTab(contentId);
};
