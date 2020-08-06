import React from 'react';
import { Route, Switch, withRouter } from 'react-router';
import CallbackPage from '../routes/CallbackPage';
import { connect } from 'react-redux';

function Authenticator({
                         appRoutes,
                         userManager,
                         user,
                         oidcAuthority,
                         location}) {
  const userLoggedIn = userManager && user && !user.expired;

  if (userLoggedIn) {
    return appRoutes;
  }

  const { pathname, search } = location;

  if (pathname !== '/callback') {
    sessionStorage.setItem(
      'ohif-redirect-to',
      JSON.stringify({ pathname, search })
    );
  }

  return (
    <Switch>
      <Route
        exact
        path="/silent-refresh.html"
        onEnter={window.location.reload}
      />
      <Route
        exact
        path="/logout-redirect"
        render={() => (
          <SignoutCallbackComponent
            userManager={userManager}
            successCallback={() => console.log('Signout successful')}
            errorCallback={error => {
              console.warn(error);
              console.warn('Signout failed');
            }}
          />
        )}
      />
      <Route
        path="/callback"
        render={() => <CallbackPage userManager={userManager} />}
      />
      <Route
        path="/login"
        component={() => {
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
        component={() => {
          userManager.getUser().then(user => {
            if (user) {
              userManager.signinSilent();
            } else {
              userManager.signinRedirect();
            }
          });

          return null;
        }}
      />
    </Switch>
  );
}

const mapStateToProps = state => {
  return {
    user: state.user,
  };
};

const ConnectedAuthenticator = connect(
  mapStateToProps,
  null
)(Authenticator);

const AuthenticatorWithRouter = withRouter(ConnectedAuthenticator);

export default AuthenticatorWithRouter;
