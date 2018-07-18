import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/clinical:router';

// Functions
import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';

OHIF.studylist.functions = {
    getStudyPriors,
    getStudyPriorsMap
};

// Add deprecation notice to the OHIF.studylist.classes namespace
const note = 'OHIF.studylist.classes is deprecated.';
const instructions = 'Please use OHIF.studies.classes instead.';
Object.defineProperty(OHIF.studylist, 'classes', {
    get() {
        OHIF.log.warn(`${note}\n${instructions}`);
        return OHIF.studies.classes;
    }
});

const dblClickOnStudy = data => {
    Router.go('viewerStudies', { studyInstanceUids: data.studyInstanceUid });
};

OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;
