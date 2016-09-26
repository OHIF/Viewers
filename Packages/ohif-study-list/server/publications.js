import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.publish('studyImportStatus', () => {
    return OHIF.studylist.collections.StudyImportStatus.find();
});
