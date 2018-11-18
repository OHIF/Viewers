import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

OHIF.user = OHIF.user || {};

// These should be overridden by the implementation
OHIF.user.schema = null;
OHIF.user.userLoggedIn = () => false;
OHIF.user.getUserId = () => null;
OHIF.user.getName = () => null;
OHIF.user.getAccessToken = () => null;
OHIF.user.login = () => new Promise((resolve, reject) => reject());
OHIF.user.logout = () => new Promise((resolve, reject) => reject());
OHIF.user.getData = (key) => null;
OHIF.user.setData = (key, value) => null;
OHIF.user.validate = () => null;
