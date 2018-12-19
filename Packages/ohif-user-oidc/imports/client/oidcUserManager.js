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

function httpGetSync(theUrl)
{
    // TODO: consider making it async somehow
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

const id = oidcClient.clientId || httpGetSync( Meteor.absoluteUrl('/gcloud-client-id'));
const settings = {
    authority: oidcClient.authServerUrl,
    client_id: id,
    redirect_uri,
    silent_redirect_uri,
    post_logout_redirect_uri: Meteor.absoluteUrl(oidcClient.postLogoutRedirectUri),
    response_type: oidcClient.responseType || 'id_token token',
    scope: oidcClient.scope || 'email profile openid https://www.googleapis.com/auth/cloud-platform.read-only https://www.googleapis.com/auth/cloud-healthcare', // seems like scope is not loaded from settings Note: Request must have scope 'openid' to be considered an OpenID Connect request
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
};

const itemName = `oidc.user:${oidcClient.authServerUrl}:${id}`;

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

OHIF.user.getOidcStorageKey = function () {
    return itemName;
}

OHIF.user.getOidcRedirectUri = function () {
    return oidcClient.authRedirectUri;
}

OHIF.user.login = function oidcLogin() {
    oidcUserManager.signinRedirect({redirect_uri});
}

OHIF.user.logout = function oidcLogout() {
    const config = JSON.parse(sessionStorage.getItem(itemName) || null);
    if (oidcClient.revokeUrl && config && config.access_token) {
        // OIDC from Google doesn't support signing out for some reason
        // so we revoke the token manually
        sessionStorage.removeItem(itemName);
        const revokeUrl = oidcClient.revokeUrl + config.access_token;
        fetch(revokeUrl).catch(()=>{}).then(() => location.assign(oidcClient.postLogoutRedirectUri || '/'));
        
    } else {
        // simple oidc signout behavior
        oidcUserManager.signoutRedirect();
    }
}

OHIF.user.userLoggedIn = () => !!getTokenFromStorage();

// See https://github.com/IdentityModel/oidc-client-js/wiki for more information
const oidcUserManager = new Oidc.UserManager(settings);

const LOGIN_REQUIRED = 'login_required'

function handleSilentRenewError(error) {
    console.error(error);

    if (error.error === LOGIN_REQUIRED) {
        OHIF.user.logout();
    }
}

oidcUserManager.events.addSilentRenewError(handleSilentRenewError);
oidcUserManager.startSilentRenew();
oidcUserManager.events.addAccessTokenExpired(function(){
    OHIF.user.logout();
});

export default oidcUserManager;
