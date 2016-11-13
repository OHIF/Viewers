import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { OHIF } from 'meteor/ohif:core';

// Use Aldeed's meteor-template-extension package to replace the
// default StudyListStudy template.
// See https://github.com/aldeed/meteor-template-extension
const defaultTemplate = 'studyContextMenu';

Template.longitudinalStudyListContextMenu.replaces(defaultTemplate);

StudyList.functions.launchStudyAssociation = () => OHIF.ui.showFormDialog('dialogStudyAssociation');
StudyList.functions.removeTimepointAssociations = removeTimepointAssociations;
StudyList.functions.exportSelectedStudies = exportSelectedStudies;
StudyList.functions.viewStudies = viewStudies;

/**
 * Removes all present study / timepoint associations from the Clinical Trial
 */
function removeTimepointAssociations() {
    // Get a Cursor pointing to the selected Studies from the StudyList
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    // Find the Timepoint that was previously referenced
    const timepointApi = StudyList.timepointApi;
    if (!timepointApi) {
        OHIF.log.error('Remove Study/Timepoint Association: No Timepoint API found.')
        return;
    }

    // Loop through the Cursor of Selected Studies
    selectedStudies.forEach(study => {
        const studyInstanceUid = study.studyInstanceUid;
        const timepoints = timepointApi.study(studyInstanceUid);
        const timepointIds = timepoints.map(t => t.timepointId);
        timepointApi.disassociateStudy(timepointIds, studyInstanceUid);
    });
}

// ---------- TODO: Remove these duplicated functions below -------------

/**
 * Exports all selected studies on the studylist
 */
function exportSelectedStudies() {
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    if (!selectedStudies || !selectedStudies.length) {
        return;
    }

    OHIF.studylist.exportStudies(selectedStudies);
}

/**
 * Loads multiple unassociated studies in the Viewer
 */
function viewStudies() {
    OHIF.log.info('viewStudies');
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    if (!selectedStudies || !selectedStudies.length) {
        return;
    }

    const title = selectedStudies[0].patientName;
    const studyInstanceUids = selectedStudies.map(study => study.studyInstanceUid);

    // Generate a unique ID to represent this tab
    // We can't just use the Mongo entry ID because
    // then it will change after hot-reloading.
    const contentid = Random.id();

    // Update the ViewerData global object
    ViewerData[contentid] = {
        title: title,
        contentid: contentid,
        studyInstanceUids: studyInstanceUids
    };

    // Switch to the new tab
    switchToTab(contentid);
}
