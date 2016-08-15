import { Mongo } from 'meteor/mongo';
import { schema as ReviewerSchema } from 'meteor/ohif:user-management/both/schema/reviewers.js';

// Reviewers is used to determine which users already have a
// Timepoint open
Reviewers = new Mongo.Collection('reviewers');
Reviewers.attachSchema(ReviewerSchema);
Reviewers._debugName = 'Reviewers';
