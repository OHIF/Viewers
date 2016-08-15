ViewerStudies = new Meteor.Collection(null);
ViewerStudies._debugName = 'ViewerStudies';

Meteor.subscribe('studyImportStatus');