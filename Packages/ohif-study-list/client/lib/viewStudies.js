import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/clinical:router';

/**
 * Loads multiple unassociated studies in the Viewer
 */
OHIF.studylist.viewStudies = () => {
    OHIF.log.info('viewStudies');
    const selectedStudies = OHIF.studylist.getSelectedStudies();

    if (!selectedStudies || !selectedStudies.length) {
        return;
    }

    const studyInstanceUids = selectedStudies.map(study => study.studyInstanceUid).join(';');

    Router.go('viewerStudies', { studyInstanceUids });
};
