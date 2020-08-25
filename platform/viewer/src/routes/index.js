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
                <route.component
                  {...props}
                  {...route.props}
                  route={route}
                  servicesManager={servicesManager}
                  hotkeysManager={hotkeysManager}
                />
              </ErrorBoundary>
            )}
          />
        );
      })}
    </Switch>
  );
};

export default createRoutes;
