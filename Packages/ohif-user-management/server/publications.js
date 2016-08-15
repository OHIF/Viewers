import { Meteor } from 'meteor/meteor';

Meteor.publish('reviewers', function() {
    return Reviewers.find();
});