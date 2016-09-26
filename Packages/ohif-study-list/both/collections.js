import { Mongo } from 'meteor/mongo';
import { OHIF } from 'meteor/ohif:core';
import { Servers as ServerSchema } from 'meteor/ohif:study-list/both/schema/servers.js';

const StudyImportStatus = new Mongo.Collection('studyImportStatus');
StudyImportStatus._debugName = 'StudyImportStatus';
OHIF.studylist.collections.StudyImportStatus = StudyImportStatus;

// Servers describe the DICOM servers configurations
Servers = new Mongo.Collection('servers');
// TODO: Make the Schema match what we are currently sticking into the Collection
//Servers.attachSchema(ServerSchema);
Servers._debugName = 'Servers';

// CurrentServer is a single document collection to describe which of the Servers is being used
CurrentServer = new Mongo.Collection('currentServer');
CurrentServer._debugName = 'CurrentServer';

export { StudyImportStatus, Servers, CurrentServer };