ViewerStudies = new Meteor.Collection(null);
ViewerStudies._debugName = 'ViewerStudies';

ClientId = Random.id();

Meteor.subscribe('studyImportStatus');