import { Mongo } from 'meteor/mongo';
import { OHIF } from 'meteor/ohif:core';

const StudyImportStatus = new Mongo.Collection('studyImportStatus');
StudyImportStatus._debugName = 'StudyImportStatus';
OHIF.studylist.collections.StudyImportStatus = StudyImportStatus;

export { StudyImportStatus };
