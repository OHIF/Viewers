import { OHIF } from 'meteor/ohif:core';

OHIF.studylist.getSelectedStudies = () => {
    return OHIF.studylist.collections.Studies.find({ selected: true }, {
        sort: {
            studyDate: 1
        }
    }).fetch() || [];
};
