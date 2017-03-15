import { OHIF } from 'meteor/ohif:core';
import { Viewerbase } from 'meteor/ohif:viewerbase';
// Classes
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { OHIFStudySummary } from './OHIFStudySummary';
// Functions
import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';

StudyList = {
    functions: {
        getStudyPriors,
        getStudyPriorsMap
    },
    classes: {
        OHIFStudyMetadataSource,
        OHIFStudySummary
    }
};

OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;

function dblClickOnStudy(data) {
    openNewTab(data.studyInstanceUid);
}

let currentServerChangeHandlerFirstRun = true;
const currentServerChangeHandler = () => {
    if (currentServerChangeHandlerFirstRun) {
        currentServerChangeHandlerFirstRun = false;
        return;
    }

    switchToTab('studylistTab');
};

CurrentServer.find().observe({
    added: currentServerChangeHandler,
    changed: currentServerChangeHandler
});
