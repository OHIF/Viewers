import Oidc from 'oidc-client';

Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.DEBUG;

const { oidc } = Meteor.settings.public.custom;

const settings = {
    authority: oidc.authServerUrl,
    client_id: oidc.clientId,
    redirect_uri: Meteor.absoluteUrl(oidc.authRedirectUri),
    post_logout_redirect_uri: Meteor.absoluteUrl(oidc.postLogoutRedirectUri),
    response_type: 'id_token token',
    scope: 'email profile openid', // Note: Request must have scope 'openid' to be considered an OpenID Connect request
};

console.warn(settings);
const oidcUserManager = new Oidc.UserManager(settings);

oidcUserManager.events.addAccessTokenExpiring(function () {
    console.log("token expiring");
});

oidcUserManager.events.addAccessTokenExpired(function () {
    console.log("token expired");
});

oidcUserManager.events.addSilentRenewError(function (e) {
    console.log("silent renew error", e.message);
});

oidcUserManager.events.addUserLoaded(function (user) {
    console.log("user loaded", user);
    oidcUserManager.getUser().then(() => {
        console.log("getUser loaded user after userLoaded event fired");
    });
});

oidcUserManager.events.addUserUnloaded(function (e) {
    console.log("user unloaded");
});

OHIF.oidcUserManager = oidcUserManager;
