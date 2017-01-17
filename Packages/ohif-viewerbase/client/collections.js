import { Meteor } from 'meteor/meteor';
import { OHIF } from '../namespace';
import { TypeSafeCollection } from './lib/classes/TypeSafeCollection';

// Create main Studies collection which will be used across the entire viewer...
const Studies = new TypeSafeCollection();

// Make it publicly available on "OHIF.viewer" namespace...
OHIF.viewer.Studies = Studies;

// Subscriptions...
Meteor.subscribe('studyImportStatus');
