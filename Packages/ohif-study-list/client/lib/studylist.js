import { Viewerbase } from 'meteor/ohif:viewerbase';
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';

StudyList = {
    functions: {},
    callbacks: {},
    classes: {
        OHIFStudyMetadataSource
    }
};

StudyList.callbacks.dblClickOnStudy = dblClickOnStudy;
StudyList.callbacks.middleClickOnStudy = dblClickOnStudy;

function dblClickOnStudy(data) {
    // Use the formatPN template helper to clean up the patient name
    var title = Viewerbase.helpers.formatPN(data.patientName);
    openNewTab(data.studyInstanceUid, title);
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
