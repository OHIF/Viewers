import React from 'react';
import { Switch, Route } from 'react-router-dom';
// Route Components
import DataSourceWrapper from './DataSourceWrapper';
import WorkList from './WorkList';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';
import { ErrorBoundary } from '@ohif/ui';

// TODO: Make these configurable
// TODO: Include "routes" debug route if dev build
const bakedInRoutes = [
  // WORK LIST
  {
    path: '/',
    exact: true,
    component: DataSourceWrapper,
    props: { children: WorkList },
  },
  // NOT FOUND (404)
  { component: NotFound },
];

const createRoutes = ({
  modes,
  dataSources,
  extensionManager,
  servicesManager,
  hotkeysManager,
}) => {
  const routes =
    buildModeRoutes({
      modes,
      dataSources,
      extensionManager,
      servicesManager,
      hotkeysManager,
    }) || [];

  const allRoutes = [...routes, ...bakedInRoutes];

  /*
render() {
    const { user, userManager } = this.props;
    const { appConfig = {} } = this.context;
    const userNotLoggedIn = userManager && (!user || user.expired);
    if (userNotLoggedIn) {
      const { pathname, search } = this.props.location;

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
            onEnter={RoutesUtil.reload}
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
              const queryParams = new URLSearchParams(
                this.props.location.search
              );
              const iss = queryParams.get('iss');
              const loginHint = queryParams.get('login_hint');
              const targetLinkUri = queryParams.get('target_link_uri');
              const oidcAuthority =
                appConfig.oidc !== null && appConfig.oidc[0].authority;
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
   */

  return (
    <Switch>
      {allRoutes.map((route, i) => {
        return (
          <Route
            key={i}
            path={route.path}
            exact={route.exact}
            strict={route.strict}
            render={props => (
              // eslint-disable-next-line react/jsx-props-no-spreading
              <ErrorBoundary context={`Route ${route.path}`} fallbackRoute="/">
                <route.component {...props} {...route.props} route={route} />
              </ErrorBoundary>
            )}
          />
        );
      })}
    </Switch>
  );
};

export default createRoutes;
