import { Meteor } from "meteor/meteor";
import { OHIF } from 'meteor/ohif:core';

import oidcUserManager from './oidcUserManager.js';

OHIF.user.getAccessToken = async function() {
    const user = await oidcUserManager.getUser();
    if (!user) {
        throw new Error('User is not logged in.');
    }

    return user.accessToken;
};

OHIF.user.logout = function oidcLogout() {
    delete sessionStorage.token;

    oidcUserManager.signoutRedirect();
}

OHIF.user.userLoggedIn = () => !!sessionStorage.token;
