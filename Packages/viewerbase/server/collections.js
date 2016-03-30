Meteor.publish('studyImportStatus', function() {
    return StudyImportStatus.find();
});