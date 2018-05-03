import { Meteor } from 'meteor/meteor';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

// When publishing Servers Collection, do not publish the requestOptions.headers
// field in case any authentication information is being passed
Meteor.publish('servers', () => Servers.find({}, {
    fields: {
        'requestOptions.headers': 0,
        'requestOptions.auth': 0,
    }
}));

Meteor.publish('currentServer', () => CurrentServer.find());
