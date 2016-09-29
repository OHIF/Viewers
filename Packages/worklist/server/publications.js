Meteor.publish('studyImportStatus', () => {
    return StudyImportStatus.find();
});

Meteor.publish('servers', () => {
    return Servers.find();
});

Meteor.publish('currentServer', () => {
    return CurrentServer.find();
});
