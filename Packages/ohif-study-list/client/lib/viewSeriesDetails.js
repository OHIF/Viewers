import { OHIF } from 'meteor/ohif:core';

/**
 * Display series details of study in a modal
 */
OHIF.studylist.viewSeriesDetails = () => {
    const selectedStudies = OHIF.studylist.getSelectedStudies();
    if (!selectedStudies) return;
    OHIF.ui.showDialog('seriesDetailsModal', { selectedStudies });
};
