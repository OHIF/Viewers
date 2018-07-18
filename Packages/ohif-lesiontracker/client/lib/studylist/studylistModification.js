import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {
    if (!OHIF.studylist) return;

    OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
    OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;

    OHIF.studylist.timepointApi = new OHIF.measurements.TimepointApi();
});

/**
 * Lesion Tracker method including Timepoints / other studies
 */
const dblClickOnStudy = data => {
    // Find the relevant timepoint given the clicked-on study
    const timepointApi = OHIF.studylist.timepointApi;
    if (!timepointApi) {
        OHIF.log.warn('No timepoint api on dbl-clicked study?');
        return;
    }

    const timepoint = timepointApi.study(data.studyInstanceUid)[0];
    if (timepoint) {
        Router.go('viewerTimepoint', { timepointId: timepoint.timepointId });
    } else {
        Router.go('viewerStudies', { studyInstanceUids: data.studyInstanceUid });
    }
};
