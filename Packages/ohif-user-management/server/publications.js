import { Meteor } from 'meteor/meteor';

Meteor.publish('reviewers', function() {
    return Reviewers.find();
});

Meteor.publish('servers', () => {
    return Servers.find();
});