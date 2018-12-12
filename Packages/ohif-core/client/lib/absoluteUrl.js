import { Meteor } from 'meteor/meteor';

export default function(path) {
    if (path) {
        // Remove the leading "/"
        path = path.replace(/^\//, '');
    }

    return Meteor.absoluteUrl(path);
}
