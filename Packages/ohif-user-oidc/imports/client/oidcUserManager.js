import Oidc from 'oidc-client';

Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.DEBUG;

const { oidc } = Meteor.settings.public.custom;

const settings = {
    authority: oidc.authServerUrl,
    client_id: oidc.clientId,
    redirect_uri: Meteor.absoluteUrl(oidc.authRedirectUri),
    post_logout_redirect_uri: Meteor.absoluteUrl(oidc.postLogoutRedirectUri),
    response_type: oidc.responseType || 'id_token token',
    scope: oidc.scope || 'email profile openid', // Note: Request must have scope 'openid' to be considered an OpenID Connect request
};

// See https://github.com/IdentityModel/oidc-client-js/wiki for more information
const oidcUserManager = new Oidc.UserManager(settings);

export default oidcUserManager;
