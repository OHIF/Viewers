import { TypeSafeCollection } from './lib/classes/TypeSafeCollection';

Studies = new TypeSafeCollection();

ViewerStudies = new Meteor.Collection(null);
ViewerStudies._debugName = 'ViewerStudies';

Meteor.subscribe('studyImportStatus');
