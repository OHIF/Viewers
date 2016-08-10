import { StudyImportStatus } from '../both/collections';

Meteor.publish('studyImportStatus', () => {
    return StudyImportStatus.find();
});