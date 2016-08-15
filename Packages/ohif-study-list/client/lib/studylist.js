StudyList = {
    functions: {},
    callbacks: {}
};

StudyList.callbacks.dblClickOnStudy = dblClickOnStudy;
StudyList.callbacks.middleClickOnStudy = dblClickOnStudy;

function dblClickOnStudy(data) {
    // Use the formatPN template helper to clean up the patient name
    var title = formatPN(data.patientName);
    openNewTab(data.studyInstanceUid, title);
}