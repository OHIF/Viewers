import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

import oidcUserManager from './oidcUserManager.js';

/**
 * Trigger a redirect to the OpenID Connect client Sign In page.
 *
 * @param {Object} args Arguments to UserManager.signinRedirect
 * @return {Promise}
 */
function signIn(args) {
    return oidcUserManager.signinRedirect(args);
}

/**
 *
 */
function removeHash () {
    history.pushState("", document.title, window.location.pathname
        + window.location.search);
}


/**
 * Handle the response from an OpenID Connect client Sign In page.
 *
 * Upon completion, store the user access token in Session Storage
 * for easy access from the rest of the application.
 *
 * @return {Promise}
 */
function processSignInResponse(redirect_uri) {
    return oidcUserManager.signinRedirectCallback().then(() => {
        removeHash();
    });
}

/**
 * Retrieve the current User from the oidc-client-js UserManager.
 *
 * @return {Promise}
 */
function getUser() {
    return oidcUserManager.getUser();
}

/**
 * Check if the current window location contains an OAuth
 * sign-in response.
 *
 * @return {boolean} True if the URL contains an OAuth
 *                   sign-in response (e.g. &state=...)
 */
function urlHasSignInResponse() {
    const hash = window.location.hash.substring(1);
    const params = {};

    hash.split('&').map(hk => {
        const temp = hk.split('=');
        params[temp[0]] = temp[1]
    });

    return !!params.state;
}

Router.onRun(function() {
    const isSignedIn = OHIF.user.userLoggedIn() || OHIF.demoMode && OHIF.demoMode.userLoggedIn();
    const isDemoPage = OHIF.demoMode && this.url === "/demo-signin";

    if (isSignedIn || isDemoPage)
        this.next();
    else if (urlHasSignInResponse() === true)
        processSignInResponse().then(this.next);
    else {
        const redirect_uri = Meteor.absoluteUrl(OHIF.user.getOidcRedirectUri());
        signIn({ redirect_uri });
    }
});

Router.route(OHIF.user.getOidcRedirectUri(), function() {
    Router.go('/', {}, { replaceState: true });
}, { name: 'oidc_redirect' });


