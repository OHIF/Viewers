import { OHIF } from 'meteor/ohif:core';

// Functions
import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';

OHIF.studylist.functions = {
    getStudyPriors,
    getStudyPriorsMap
};

const dblClickOnStudy = data => {
    //Router.go('viewerStudies', { studyInstanceUids: data.studyInstanceUid });
    console.log('dblClickOnStudy');
};

OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;
