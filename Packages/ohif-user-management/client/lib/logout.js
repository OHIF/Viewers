import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.logout = () => {
    Meteor.logout(function() {
        Router.go('/entrySignIn');
    });
};
