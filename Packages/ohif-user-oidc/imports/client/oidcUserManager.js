import { OHIF } from 'meteor/ohif:core';
import Oidc from 'oidc-client';
import {Meteor} from "meteor/meteor";

Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.DEBUG;

const { oidc } = Meteor.settings.public.custom;

if (oidc.length > 1) {
    OHIF.log.warn("Only one OpenID Connect provider is currently supported. Using the first item in the Meteor.settings.public.custom.oidc array.")
}

const oidcClient = oidc[0];

const settings = {
    authority: oidcClient.authServerUrl,
    client_id: oidcClient.clientId,
    redirect_uri: Meteor.absoluteUrl(oidcClient.authRedirectUri),
    post_logout_redirect_uri: Meteor.absoluteUrl(oidcClient.postLogoutRedirectUri),
    response_type: oidcClient.responseType || 'id_token token',
    scope: oidc.scope || 'email profile openid', // Note: Request must have scope 'openid' to be considered an OpenID Connect request
};

// See https://github.com/IdentityModel/oidc-client-js/wiki for more information
const oidcUserManager = new Oidc.UserManager(settings);

export default oidcUserManager;
