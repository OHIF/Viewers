import React from 'react';
import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import CallbackPage from '../routes/CallbackPage';
import SignoutCallbackComponent from '../routes/SignoutCallbackComponent';
import getUserManagerForOpenIdConnectClient from './getUserManagerForOpenIdConnectClient.js';

function _isAbsoluteUrl(url) {
  return url.includes('http://') || url.includes('https://');
}

function _makeAbsoluteIfNecessary(url, base_url) {
  if (_isAbsoluteUrl(url)) {
    return url;
  }

  /*
   * Make sure base_url and url are not duplicating slashes.
   */
  if (base_url[base_url.length - 1] === '/') {
    base_url = base_url.slice(0, base_url.length - 1);
  }

  return base_url + url;
}

const initUserManager = (oidc, routerBasename) => {
  if (!oidc || !oidc.length) {
    return;
  }

  const firstOpenIdClient = oidc[0];
  const { protocol, host } = window.location;
  const baseUri = `${protocol}//${host}${routerBasename}`;

  const redirect_uri = firstOpenIdClient.redirect_uri || '/callback';
  const silent_redirect_uri = firstOpenIdClient.silent_redirect_uri || '/silent-refresh.html';
  const post_logout_redirect_uri = firstOpenIdClient.post_logout_redirect_uri || '/';

  const openIdConnectConfiguration = Object.assign({}, firstOpenIdClient, {
    redirect_uri: _makeAbsoluteIfNecessary(redirect_uri, baseUri),
    silent_redirect_uri: _makeAbsoluteIfNecessary(silent_redirect_uri, baseUri),
    post_logout_redirect_uri: _makeAbsoluteIfNecessary(post_logout_redirect_uri, baseUri),
  });

  return getUserManagerForOpenIdConnectClient(openIdConnectConfiguration);
};

function LogoutComponent(props) {
  const { userManager } = props;
  localStorage.setItem('signoutEvent', 'true');
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  userManager.signoutRedirect({
    post_logout_redirect_uri: query.get('redirect_uri'),
  });
  return null;
}

function LoginComponent(userManager) {
  const queryParams = new URLSearchParams(location.search);
  const iss = queryParams.get('iss');
  const loginHint = queryParams.get('login_hint');
  const targetLinkUri = queryParams.get('target_link_uri');
  if (iss !== oidcAuthority) {
    console.error('iss of /login does not match the oidc authority');
    return null;
  }

  userManager.removeUser().then(() => {
    if (targetLinkUri !== null) {
      const ohifRedirectTo = {
        pathname: new URL(targetLinkUri).pathname,
      };
      sessionStorage.setItem('ohif-redirect-to', JSON.stringify(ohifRedirectTo));
    } else {
      const ohifRedirectTo = {
        pathname: '/',
      };
      sessionStorage.setItem('ohif-redirect-to', JSON.stringify(ohifRedirectTo));
    }

    if (loginHint !== null) {
      userManager.signinRedirect({ login_hint: loginHint });
    } else {
      userManager.signinRedirect();
    }
  });

  return null;
}

function OpenIdConnectRoutes({ oidc, routerBasename, userAuthenticationService }) {
  const userManager = initUserManager(oidc, routerBasename);

  const getAuthorizationHeader = () => {
    const user = userAuthenticationService.getUser();

    // if the user is null return early, next time
    // we hit this function we will have a user
    if (!user) {
      return;
    }

    return {
      Authorization: `Bearer ${user.access_token}`,
    };
  };

  const handleUnauthenticated = async () => {
    await userManager.signinRedirect();

    // return null because this is used in a react component
    return null;
  };

  const navigate = useNavigate();

  //for multi-tab logout
  useEffect(() => {
    localStorage.removeItem('signoutEvent');
    const storageEventListener = event => {
      const signOutEvent = localStorage.getItem('signoutEvent');
      if (signOutEvent) {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      }
    };

    window.addEventListener('storage', storageEventListener);

    return () => {
      window.removeEventListener('storage', storageEventListener);
    };
  }, []);

  useEffect(() => {
    userAuthenticationService.set({ enabled: true });

    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader,
      handleUnauthenticated,
    });
  }, []);

  const oidcAuthority = oidc[0].authority;

  const location = useLocation();
  const { pathname, search } = location;

  const redirect_uri = new URL(userManager.settings._redirect_uri).pathname.replace(
    routerBasename !== '/' ? routerBasename : '',
    ''
  );
  const silent_refresh_uri = new URL(userManager.settings._silent_redirect_uri).pathname; //.replace(routerBasename,'')
  const post_logout_redirect_uri = new URL(userManager.settings._post_logout_redirect_uri).pathname; //.replace(routerBasename,'');

  // const pathnameRelative = pathname.replace(routerBasename,'');

  if (pathname !== redirect_uri) {
    sessionStorage.setItem('ohif-redirect-to', JSON.stringify({ pathname, search }));
  }

  return (
    <Routes>
      <Route
        path={silent_refresh_uri}
        onEnter={window.location.reload}
      />
      <Route
        path={post_logout_redirect_uri}
        element={
          <SignoutCallbackComponent
            userManager={userManager}
            successCallback={() => console.log('Signout successful')}
            errorCallback={error => {
              console.warn(error);
              console.warn('Signout failed');
            }}
          />
        }
      />
      <Route
        path={redirect_uri}
        element={
          <CallbackPage
            userManager={userManager}
            onRedirectSuccess={user => {
              const { pathname, search = '' } = JSON.parse(
                sessionStorage.getItem('ohif-redirect-to')
              );

              userAuthenticationService.setUser(user);

              navigate({
                pathname,
                search,
              });
            }}
          />
        }
      />
      <Route
        path="/login"
        element={
          <LoginComponent
            userManager={userManager}
            oidcAuthority={oidcAuthority}
          />
        }
      />
      <Route
        path="/logout"
        element={<LogoutComponent userManager={userManager} />}
      />
    </Routes>
  );
}

export default OpenIdConnectRoutes;
