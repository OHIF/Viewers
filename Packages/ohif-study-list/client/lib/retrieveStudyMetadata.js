import { OHIF } from 'meteor/ohif:core';

const note = 'OHIF.studylist.retrieveStudyMetadata is deprecated.';
const instructions = 'Please use OHIF.studies.retrieveStudyMetadata instead.';

/**
 * @deprecated Please use OHIF.studies.retrieveStudyMetadata instead
 */
OHIF.studylist.retrieveStudyMetadata = function() {
    OHIF.log.warn(`${note}\n${instructions}`);
    OHIF.studies.retrieveStudyMetadata.apply(this, arguments);
};
