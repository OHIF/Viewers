import { OHIF } from 'meteor/ohif:core';

const note = 'OHIF.studylist.retrieveStudiesMetadata is deprecated.';
const instructions = 'Please use OHIF.studies.retrieveStudiesMetadata instead.';

/**
 * @deprecated Please use OHIF.studies.retrieveStudiesMetadata instead
 */
OHIF.studylist.retrieveStudiesMetadata = function() {
    OHIF.log.warn(`${note}\n${instructions}`);
    OHIF.studies.retrieveStudiesMetadata.apply(this, arguments);
};
