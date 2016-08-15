Meteor.publish('studyImportStatus', () => {
    return StudyImportStatus.find();
});