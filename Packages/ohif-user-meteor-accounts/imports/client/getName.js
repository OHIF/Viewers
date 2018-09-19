import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.getName = () => {
    const user = Meteor.user();
    if (!user) return '';
    const nameSplit = user.profile.fullName.split(' ');
    const lastName = nameSplit[nameSplit.length - 1];
    nameSplit[nameSplit.length - 1] = lastName.substr(0, 1) + '.';
    return nameSplit.join(' ');
};
