import { Mongo } from 'meteor/mongo';

StudyImportStatus = new Mongo.Collection('studyImportStatus');

// Servers describe the DICOM servers configurations
Servers = new Mongo.Collection('servers');

// CurrentServer is a single document collection to describe which of the Servers is being used
CurrentServer = new Mongo.Collection('currentServer');
