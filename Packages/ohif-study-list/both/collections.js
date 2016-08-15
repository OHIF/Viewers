import { Mongo } from 'meteor/mongo';

StudyImportStatus = new Mongo.Collection('studyImportStatus');
StudyImportStatus._debugName = 'StudyImportStatus';