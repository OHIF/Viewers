import { Meteor } from 'meteor/meteor';

export const absoluteUrl = function(path) {
    if (path) {
        // Remove the leading "/"
        path = path.replace(/^\//, '');
    }

    return Meteor.absoluteUrl(path);
};
