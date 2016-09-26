import { OHIF } from 'meteor/ohif:core';

OHIF.studylist.getSelectedStudies = () => {
    return StudyListSelectedStudies.find({}, {
        sort: {
            studyDate: 1
        }
    }).fetch() || [];
};
