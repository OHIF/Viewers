import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.logout = () => new Promise((resolve, reject) => {
    Meteor.logout(error => {
        if (error) {
            reject(error);
        }

        resolve();
    });
});
