import { Meteor } from "meteor/meteor";
import { OHIF } from 'meteor/ohif:core';

import oidcUserManager from './oidcUserManager.js';

OHIF.user.getAccessToken = function oidcGetAccessToken() {
    if (!OHIF.user.userLoggedIn) {
        throw new Error('User is not logged in.');
    }

    return sessionStorage.token;
};

OHIF.user.logout = function oidcLogout() {
    delete sessionStorage.token;

    oidcUserManager.signoutRedirect();
}

OHIF.user.userLoggedIn = () => !!sessionStorage.token;
