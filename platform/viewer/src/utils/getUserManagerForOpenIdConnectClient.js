// https://github.com/maxmantz/redux-oidc/blob/master/docs/API.md
import { loadUser, createUserManager } from 'redux-oidc';

/**
 * Creates a userManager from oidcSettings;
 * loads the user into the provided redux store
 * LINK: https://github.com/IdentityModel/oidc-client-js/wiki#configuration
 *
 * @param {*} store
 * @param {Object} oidcSettings
 * @param {string} oidcSettings.authServerUrl,
 * @param {string} oidcSettings.clientId,
 * @param {string} oidcSettings.authRedirectUri,
 * @param {string} oidcSettings.postLogoutRedirectUri,
 * @param {string} oidcSettings.responseType,
 * @param {string} oidcSettings.extraQueryParams,
 */
export default function(store, oidcSettings) {
  if (!store || !oidcSettings) {
    return;
  }

  const settings = {
    ...oidcSettings,
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
    filterProtocolClaims: true,
  };

  const userManager = createUserManager(settings);

  loadUser(store, userManager);

  return userManager;
}
