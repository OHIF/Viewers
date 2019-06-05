/*
TODO: Handle logout

  OHIF.user.logout = function oidcLogout() {
    const config = JSON.parse(sessionStorage.getItem(itemName) || null);
    if (oidcClient.revokeUrl && config && config.access_token) {
      // OIDC from Google doesn't support signing out for some reason
      // so we revoke the token manually
      sessionStorage.removeItem(itemName);
      const revokeUrl = oidcClient.revokeUrl + config.access_token;
      fetch(revokeUrl)
        .catch(() => {})
        .then(() => {
          window.location.href = oidcClient.postLogoutRedirectUri || '/';
        });
    } else {
      // simple oidc signout behavior
      userManager.signoutRedirect();
    }
  };
*/
