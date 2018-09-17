import { Meteor } from "meteor/meteor";
import { OHIF } from 'meteor/ohif:core';

import oidcUserManager from './oidcUserManager.js';

OHIF.user.getAccessToken = async function() {
    const { oidcUserManager } = OHIF;

    const user = await oidcUserManager.getUser();
    if (!user) {
        throw new Error('User is not logged in.');
    }

    return user.accessToken;
};

OHIF.user.logout = function oidcLogout() {
    const { oidcUserManager } = OHIF;

    delete sessionStorage.token;

    oidcUserManager.signoutRedirect();
}

OHIF.user.userLoggedIn = () => !!sessionStorage.token;
