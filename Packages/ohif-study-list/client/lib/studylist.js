import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/iron:router';

// Classes
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { OHIFStudySummary } from './OHIFStudySummary';

// Functions
import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';

OHIF.studylist.functions = {
    getStudyPriors,
    getStudyPriorsMap
};

OHIF.studylist.classes = {
    OHIFStudyMetadataSource,
    OHIFStudySummary
};

const dblClickOnStudy = data => {
    Router.go('viewerStudies', { studyInstanceUids: data.studyInstanceUid });
};

OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;
