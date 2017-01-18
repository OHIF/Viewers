import { Template } from 'meteor/templating';
import { Random } from 'meteor/random';
import { OHIF } from 'meteor/ohif:core';

// Use Aldeed's meteor-template-extension package to replace the
// default StudyListStudy template.
// See https://github.com/aldeed/meteor-template-extension
const defaultTemplate = 'studyContextMenu';

function getAssociationAssessment() {
    // default result value
    const assessment = {
        selected: 0,
        associated: 0
    };

    // check if timepointApi is available
    const timepointApi = StudyList.timepointApi;
    if (timepointApi) {
        // Get a Cursor pointing to the selected Studies from the StudyList
        const selectedStudies = OHIF.studylist.getSelectedStudies();
        if (selectedStudies.length > 0) {
            assessment.selected = selectedStudies.length;
            // Loop through the selected Studies and return true if at least one study has no association.
            for (let i = selectedStudies.length - 1; i >= 0; --i) {
                let study = selectedStudies[i],
                    timepoints = timepointApi.study(study.studyInstanceUid);
                if (timepoints && timepoints.length > 0) {
                    assessment.associated++;
                }
            }
        }
    }

    return assessment;
}

Template.longitudinalStudyListContextMenu.helpers({

    getAssociationClasses() {
        const disabledClass = 'disabled';
        let classList = '';

        const assessment = getAssociationAssessment();
        // if (assessment.selected < 1 || assessment.associated > 0) {
        // TODO: REMOVE - Temporary for RSNA
        if (assessment.selected < 1) {
            classList += disabledClass;
        }

        return classList;
    },

    getRemoveAssociationClasses() {
        const disabledClass = 'disabled';
        let classList = '';

        const assessment = getAssociationAssessment();
        if (assessment.selected < 1 || assessment.selected !== assessment.associated) {
            classList += disabledClass;
        }

        return classList;
    }
});

Template.longitudinalStudyListContextMenu.replaces(defaultTemplate);
Template[defaultTemplate].inheritsHelpersFrom('longitudinalStudyListContextMenu');

StudyList.functions.launchStudyAssociation = () => OHIF.ui.showDialog('dialogStudyAssociation');
StudyList.functions.removeTimepointAssociations = removeTimepointAssociations;
StudyList.functions.exportSelectedStudies = exportSelectedStudies;
StudyList.functions.viewStudies = viewStudies;

/**
 * Removes all present study / timepoint associations from the Clinical Trial
 */
function removeTimepointAssociations($study, event) {
    const dialogSettings = {
        title: 'Remove Association',
        message: 'Measurements related to this Study and Timepoint will be erased. Do you really want to delete this association?',
        confirmClass: 'btn-danger',
        position: {
            x: event.clientX,
            y: event.clientY
        }
    };

    OHIF.ui.showDialog('dialogConfirm', dialogSettings).then(() => {
        // Get a Cursor pointing to the selected Studies from the StudyList
        const selectedStudies = OHIF.studylist.getSelectedStudies();

        // Find the Timepoint that was previously referenced
        const timepointApi = StudyList.timepointApi;
        if (!timepointApi) {
            OHIF.log.error('Remove Study/Timepoint Association: No Timepoint API found.');
            return;
        }

        // Loop through the Cursor of Selected Studies
        selectedStudies.forEach(study => {
            const studyInstanceUid = study.studyInstanceUid;
            const timepoints = timepointApi.study(studyInstanceUid);
            const timepointIds = timepoints.map(t => t.timepointId);
            timepointApi.disassociateStudy(timepointIds, studyInstanceUid);
        });
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
    const contentId = 'viewerTab';

    ViewerData = window.ViewerData || ViewerData;

    // Update the ViewerData global object
    ViewerData[contentId] = {
        title: title,
        contentId: contentId,
        studyInstanceUids: studyInstanceUids
    };

    // Switch to the new tab
    switchToTab(contentId);
}
