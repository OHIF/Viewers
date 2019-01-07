import { createUserManager } from 'redux-oidc';

const oidcClient = {
    authServerUrl: 'https://cancer.crowds-cure.org/auth/realms/dcm4che',
    clientId: 'crowds-cure-cancer',
    authRedirectUri: '/callback',
    postLogoutRedirectUri: '/logout-redirect.html',
    responseType: 'id_token token',
    scope: 'email profile openid',
    revokeAccessTokenOnSignout: true,
    extraQueryParams: {
        kc_idp_hint: 'crowds-cure-cancer-auth0-oidc',
        client_id: 'crowds-cure-cancer'
    }
};

const settings = {
    authority: oidcClient.authServerUrl,
    client_id: oidcClient.clientId,
    redirect_uri: oidcClient.authRedirectUri,
    silent_redirect_uri: '/silent-refresh.html',
    post_logout_redirect_uri: oidcClient.postLogoutRedirectUri,
    response_type: oidcClient.responseType,
    scope: 'email profile openid', // Note: Request must have scope 'openid' to be considered an OpenID Connect request
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
    extraQueryParams: oidcClient.extraQueryParams
};

const userManager = createUserManager(settings);

export default userManager;
