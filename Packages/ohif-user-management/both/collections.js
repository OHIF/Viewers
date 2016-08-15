import { Mongo } from 'meteor/mongo';
import { Servers as ServerSchema } from 'meteor/ohif:user-management/both/schema/servers';
import { schema as ReviewerSchema } from 'meteor/ohif:user-management/both/schema/reviewers';

// Servers describe the DICOM servers configurations
Servers = new Mongo.Collection('servers');
// TODO: Make the Schema match what we are currently sticking into the Collection
//Servers.attachSchema(ServerSchema);
Servers._debugName = 'Servers';

// Reviewers is used to determine which users already have a
// Timepoint open
Reviewers = new Mongo.Collection('reviewers');
Reviewers.attachSchema(ReviewerSchema);
Reviewers._debugName = 'Reviewers';