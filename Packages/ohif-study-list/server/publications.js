import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.publish('studyImportStatus', () => OHIF.studylist.collections.StudyImportStatus.find());

Meteor.publish('servers', () => Servers.find());

Meteor.publish('currentServer', () => CurrentServer.find());
