// https://github.com/maxmantz/redux-oidc/blob/master/docs/API.md
import { loadUser, createUserManager } from 'redux-oidc'

/**
 * Creates a userManager from oidcSettings;
 * loads the user into the provided redux store
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
    return
  }

  const {
    authServerUrl,
    clientId,
    authRedirectUri,
    postLogoutRedirectUri,
    responseType,
    extraQueryParams,
  } = oidcSettings

  const settings = {
    authority: authServerUrl,
    client_id: clientId,
    redirect_uri: authRedirectUri,
    silent_redirect_uri: '/silent-refresh.html',
    post_logout_redirect_uri: postLogoutRedirectUri,
    response_type: responseType,
    // Note: Request must have scope 'openid' to be considered an OpenID Connect request
    scope: 'email profile openid',
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
    extraQueryParams: extraQueryParams,
  }

  const userManager = createUserManager(settings)

  loadUser(store, userManager)

  return userManager
}
