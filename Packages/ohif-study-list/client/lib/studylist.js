import { OHIF } from 'ohif-core';

// Functions
/*import { getStudyPriors } from './getStudyPriors';
import { getStudyPriorsMap } from './getStudyPriorsMap';

OHIF.studylist.functions = {
    getStudyPriors,
    getStudyPriorsMap
};*/

const dblClickOnStudy = data => {
    // TODO: Switch to more appropriate routing
    window.router.history.push(`/viewer/${data.studyInstanceUid}`);
    console.log('dblClickOnStudy');
};

OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;
