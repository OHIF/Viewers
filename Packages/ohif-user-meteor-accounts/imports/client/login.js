import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.login = params => {
    return new Promise((resolve, reject) => {
        Meteor.loginWithPassword(params.username, params.password, error => {
            if (error) {
                return reject(error);
            }

            resolve();
        });
    });
};
