import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import CallbackPage from '../routes/CallbackPage';
import SignoutCallbackComponent from '../routes/SignoutCallbackComponent';

function SignInOrRedirect({ userManager, UserAuthenticationService }) {
  debugger;

  useEffect(() => {
    let cancelled = false;

    async function signIn() {
      const user = await userManager.getUser();
      if (cancelled) {
        return;
      }

      if (user) {
        userManager.signinSilent().then(user => {
          console.warn(user);

          UserAuthenticationService.setUser(user);
          debugger;
        });
      } else {
        userManager.signinRedirect();
      }
    };

    signIn();
    return () => { cancelled = true; };
  }, [userManager]);

  return null;
}

function Authenticator({ children,
                         userManager,
                         user,
                         oidcAuthority,
                         routerBasename,
                         UserAuthenticationService
                        }) {
  const userLoggedIn = userManager && user && !user.expired;

  if (userLoggedIn) {
    return children;
  }

  const location = useLocation();
  const { pathname, search } = location;

  const redirect_uri = new URL(userManager.settings._redirect_uri).pathname//.replace(routerBasename,'')
  const silent_refresh_uri = new URL(userManager.settings._silent_redirect_uri)//.pathname.replace(routerBasename,'')
  const post_logout_redirect_uri = new URL(userManager.settings._post_logout_redirect_uri)//.pathname.replace(routerBasename,'');

  // const pathnameRelative = pathname.replace(routerBasename,'');

  if (pathname !== redirect_uri) {
    sessionStorage.setItem(
      'ohif-redirect-to',
      JSON.stringify({ pathname, search })
    );
  }

  return (
    <Routes basename={routerBasename}>
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
        element={<CallbackPage userManager={userManager} onRedirectSuccess={(user) => {
          debugger;

          UserAuthenticationService.setUser(user);
        }}/>}
      />
      <Route
        path="/login"
        render={() => {
          const queryParams = new URLSearchParams(location.search);
          const iss = queryParams.get('iss');
          const loginHint = queryParams.get('login_hint');
          const targetLinkUri = queryParams.get('target_link_uri');
          if (iss !== oidcAuthority) {
            console.error(
              'iss of /login does not match the oidc authority'
            );
            return null;
          }

          userManager.removeUser().then(() => {
            if (targetLinkUri !== null) {
              const ohifRedirectTo = {
                pathname: new URL(targetLinkUri).pathname,
              };
              sessionStorage.setItem(
                'ohif-redirect-to',
                JSON.stringify(ohifRedirectTo)
              );
            } else {
              const ohifRedirectTo = {
                pathname: '/',
              };
              sessionStorage.setItem(
                'ohif-redirect-to',
                JSON.stringify(ohifRedirectTo)
              );
            }

            if (loginHint !== null) {
              userManager.signinRedirect({ login_hint: loginHint });
            } else {
              userManager.signinRedirect();
            }
          });

          return null;
        }}
      />
      <Route
        path="*"
        children={<SignInOrRedirect userManager={userManager}/>}
      />
    </Routes>
  );
}

export default Authenticator;
