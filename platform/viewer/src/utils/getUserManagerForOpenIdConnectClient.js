import { UserManager } from 'oidc-client-ts';

/**
 * Creates a userManager from oidcSettings
 *
 * @param {Object} oidcSettings
 * @param {string} oidcSettings.redirect_uri,
 * @param {string} oidcSettings.silent_redirect_uri,
 * @param {string} oidcSettings.post_logout_redirect_uri,
 * @param {string} oidcSettings.authority,
 * @param {string} oidcSettings.client_id,
 *
 */
export default function getUserManagerForOpenIdConnectClient(oidcSettings) {
  if (!oidcSettings) {
    return;
  }

  const settings = {
    ...oidcSettings,
    automaticSilentRenew: true,
    revokeTokenOnSignout: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
  };

  const userManager = new UserManager(settings);

  return userManager;
}
