import { Meteor } from "meteor/meteor";
import { OHIF } from 'meteor/ohif:core';

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

    oidcUserManager.signoutRedirect();

    delete sessionStorage.token;
}

OHIF.user.userLoggedIn = () => !!sessionStorage.token;
