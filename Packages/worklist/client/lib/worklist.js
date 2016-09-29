import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

Worklist = {
    functions: {},
    callbacks: {}
};

Worklist.callbacks.dblClickOnStudy = dblClickOnStudy;
Worklist.callbacks.middleClickOnStudy = dblClickOnStudy;

function dblClickOnStudy(data) {
    // Use the formatPN template helper to clean up the patient name
    var title = formatPN(data.patientName);
    openNewTab(data.studyInstanceUid, title);
}

let currentServerChangeHandlerFirstRun = true;
const currentServerChangeHandler = () => {
    if (currentServerChangeHandlerFirstRun) {
        currentServerChangeHandlerFirstRun = false;
        return;
    }

    switchToTab('worklistTab');
};

CurrentServer.find().observe({
    added: currentServerChangeHandler,
    changed: currentServerChangeHandler
});
