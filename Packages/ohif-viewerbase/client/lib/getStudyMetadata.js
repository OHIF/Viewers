import { OHIF } from 'meteor/ohif:core';

const getStudyMetadata = study => {
    let studyMetadata = study;
    if (study && !(studyMetadata instanceof OHIF.viewerbase.metadata.StudyMetadata)) {
        studyMetadata = new OHIF.metadata.StudyMetadata(study, study.studyInstanceUid);
    }

    return studyMetadata;
};

export { getStudyMetadata };
