import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.publish('studyImportStatus', () => OHIF.studylist.collections.StudyImportStatus.find());

// When publishing Servers Collection, do not publish the requestOptions.headers
// field in case any authentication information is being passed
Meteor.publish('servers', () => Servers.find({}, {
	fields: {
		'requestOptions.headers': 0
	}
}));

Meteor.publish('currentServer', () => CurrentServer.find());
