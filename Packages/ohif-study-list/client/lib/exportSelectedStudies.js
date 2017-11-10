import { OHIF } from 'meteor/ohif:core';

/**
 * Exports all selected studies on the studylist
 * @param event Event that triggered the export
 */
OHIF.studylist.exportSelectedStudies = event => {
    const selectedStudies = OHIF.studylist.getSelectedStudies();
    const studiesCount = selectedStudies.length;
    const studyText = studiesCount > 1 ? 'Studies' : 'Study';

    OHIF.ui.showDialog('dialogConfirm', {
        element: event.element,
        title: `Export ${studyText}`,
        message: `Would you like to export ${studiesCount} ${studyText.toLowerCase()}?`
    }).then(() => {
        OHIF.studylist.exportStudies(selectedStudies);
    }).catch(() => {});
};
