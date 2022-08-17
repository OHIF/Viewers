import React, { Suspense, Fragment } from 'react';
import { Switch, Route } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import * as RoutesUtil from './routesUtil';
import { ErrorBoundary } from '@ohif/ui';

// generate random string

export const renderRoutes = (routes = []) => (
  <Suspense fallback={<LoadingScreen />}>
    <Switch>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Component = route.component;
        const onEnter = route.onEnter;
        if (onEnter)
          return <Route exact path={route.path} onEnter={RoutesUtil.reload} />;

        return (
          <Route
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            path={route.path}
            exact={route.exact}
            render={props => (
              <Guard>
                <Layout>
                  {route.routes ? (
                    renderRoutes(route.routes)
                  ) : (
                    <ErrorBoundary context={props.match.url}>
                      <Component
                        match={props.match}
                        location={props.location}
                        {...props}
                      />
                    </ErrorBoundary>
                  )}
                </Layout>
              </Guard>
            )}
          />
        );
      })}
    </Switch>
  </Suspense>
);
