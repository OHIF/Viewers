import { OHIF } from 'meteor/ohif:core';

// Return an absolute URL with the page domain using sub path of ROOT_URL
// to let multiple domains directed to the same server work
OHIF.utils.absoluteUrl = function(path) {
    let absolutePath = '/';

    const absoluteUrl = Meteor.absoluteUrl();
    const absoluteUrlParts = absoluteUrl.split('/');

    if (absoluteUrlParts.length > 4) {
        const rootUrlPrefixIndex = absoluteUrl.indexOf(absoluteUrlParts[3]);
        absolutePath += absoluteUrl.substring(rootUrlPrefixIndex) + path;
    } else {
        absolutePath += path;
    }

    return absolutePath.replace(/\/\/+/g, '/');
};
