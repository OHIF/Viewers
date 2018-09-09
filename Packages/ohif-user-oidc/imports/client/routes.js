import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

const { oidcUserManager } = OHIF;

function signIn() {
    return oidcUserManager.signinRedirect();
}

function processSignInResponse() {
    return oidcUserManager.signinRedirectCallback().then(user => {

        // TODO: The ohif-dicomweb-client is still looking
        // directly in sessionStorage for the token. We should
        // probably stop doing that
        sessionStorage.token = user.access_token;
    });
}

function processSignOutResponse() {
    return oidcUserManager.signoutRedirectCallback();
}

function getUser() {
    return oidcUserManager.getUser();
}

function urlHasSignInResponse() {
    const hash = window.location.hash.substring(1);
    const params = {};

    hash.split('&').map(hk => {
        let temp = hk.split('=');
        params[temp[0]] = temp[1]
    });

    return !!params.state;
}

Router.onRun(function() {
    console.warn('Router onBeforeAction');

    const next = this.next;
    getUser().then((user) => {
        const loggedIn = !!user;

        // TODO: This is weird and shouldn't be happening
        if (loggedIn && !sessionStorage.token) {
            // TODO: The ohif-dicomweb-client is still looking
            // directly in sessionStorage for the token. We should
            // probably stop doing that
            sessionStorage.token = user.access_token;
        }

        console.warn('loggedIn', loggedIn, user);
        const hasSignInResponse = urlHasSignInResponse();
        const hasSignOutResponse = false; //window.location.href.indexOf("?") >= 0;

        // Check if user is signed in
        if (!loggedIn) {
            if (hasSignInResponse) {
                processSignInResponse().then(() => {
                    next();
                });
            } else {
                signIn();
            }
        } else if (loggedIn && hasSignOutResponse) {
            processSignOutResponse();
        } else {
            next();
        }
    }).catch(error => {
        console.warn(error);
        throw new Error(error);
    })
});
