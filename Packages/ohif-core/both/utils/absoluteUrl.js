import { OHIF } from 'meteor/ohif:core';

// Return an absolute URL with the given path by supporting the leading "/"
OHIF.utils.absoluteUrl = function(path) {
    if (path) {
        // Remove the leading "/"
        path = path.replace(/^\//, '');
    }

    return Meteor.absoluteUrl(path);
};