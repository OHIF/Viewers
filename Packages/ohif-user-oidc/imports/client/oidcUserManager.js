import { Meteor } from "meteor/meteor";
import { OHIF } from 'meteor/ohif:core';
import Oidc from 'oidc-client';

Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.DEBUG;

const { oidc } = Meteor.settings.public.custom;

if (oidc.length > 1) {
    OHIF.log.warn("Only one OpenID Connect provider is currently supported. Using the first item in the Meteor.settings.public.custom.oidc array.")
}

const oidcClient = oidc[0];

const redirect_uri = Meteor.absoluteUrl(oidcClient.authRedirectUri);
const silent_redirect_uri = Meteor.absoluteUrl('/packages/ohif_user-oidc/public/silent-refresh.html');


const settings = {
    authority: oidcClient.authServerUrl,
    client_id: oidcClient.clientId,
    redirect_uri,
    silent_redirect_uri,
    post_logout_redirect_uri: Meteor.absoluteUrl(oidcClient.postLogoutRedirectUri),
    response_type: oidcClient.responseType || 'id_token token',
    scope: oidc.scope || 'email profile openid', // Note: Request must have scope 'openid' to be considered an OpenID Connect request
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
};

const itemName = `oidc.user:${oidcClient.authServerUrl}:${oidcClient.clientId}`;

function getTokenFromStorage() {
    const userDataJSON = sessionStorage.getItem(itemName);
    const user = JSON.parse(userDataJSON);

    if (!user) {
        return;
    }

    return user.access_token;
}

OHIF.user.getAccessToken = function oidcGetAccessToken() {
    if (!OHIF.user.userLoggedIn) {
        throw new Error('User is not logged in.');
    }

    return getTokenFromStorage();
};

OHIF.user.logout = function oidcLogout() {
    oidcUserManager.signoutRedirect();
}

OHIF.user.userLoggedIn = () => !!getTokenFromStorage();

// See https://github.com/IdentityModel/oidc-client-js/wiki for more information
const oidcUserManager = new Oidc.UserManager(settings);

oidcUserManager.events.addSilentRenewError(function handleSilentRenew(error) {
    console.error(error);
    console.warn('silentRenewError')
    //OHIF.user.logout();
});

export default oidcUserManager;
