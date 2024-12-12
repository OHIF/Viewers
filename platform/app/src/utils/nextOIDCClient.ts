import { UserManager } from 'oidc-client-ts';

/**
 * Creates a userManager from oidcSettings
 * LINK: https://github.com/IdentityModel/oidc-client-js/wiki#configuration
 *
 * @param {Object} oidcSettings
 * @param {string} oidcSettings.authServerUrl,
 * @param {string} oidcSettings.clientId,
 * @param {string} oidcSettings.authRedirectUri,
 * @param {string} oidcSettings.postLogoutRedirectUri,
 * @param {string} oidcSettings.responseType,
 * @param {string} oidcSettings.extraQueryParams,
 */
export default function getUserManagerForOpenIdConnectClient(oidcSettings) {
  if (!oidcSettings) {
    return;
  }

  if (!oidcSettings.authority || !oidcSettings.client_id || !oidcSettings.redirect_uri) {
    console.error('Missing required oidc settings:  authority, client_id, redirect_uri');
    return;
  }

  const settings = {
    ...oidcSettings,
    // The next client always use the code flow with PKCE
    response_type: 'code',
    revokeTokensOnSignout: oidcSettings.revokeAccessTokenOnSignout ?? true,
    filterProtocolClaims: true,
    // the followings are default values in the lib so no need to set them
    // automaticSilentRenew: true,
  };

  const userManager = new UserManager(settings);

  return userManager;
}
