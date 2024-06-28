import { UserManager } from 'oidc-client';

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

  const settings = {
    ...oidcSettings,
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
  };

  const userManager = new UserManager(settings);

  return userManager;
}
