import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/clinical:router';

// Functions
import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';

OHIF.studylist.functions = {
    getStudyPriors,
    getStudyPriorsMap
};

const dblClickOnStudy = data => {
    Router.go('viewerStudies', { studyInstanceUids: data.studyInstanceUid });
};

OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;
