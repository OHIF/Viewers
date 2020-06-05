import React from 'react';
import { Switch, Route } from 'react-router-dom';
// Route Components
import DataSourceWrapper from './DataSourceWrapper';
import WorkList from './WorkList';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';

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

const createRoutes = (
  modes,
  dataSources,
  extensionManager,
  servicesManager
) => {
  const routes =
    buildModeRoutes(modes, dataSources, extensionManager, servicesManager) ||
    [];
  const allRoutes = [...routes, ...bakedInRoutes];

  console.log(
    'Creating Routes: ',
    modes,
    dataSources,
    routes,
    bakedInRoutes,
    allRoutes
  );

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
              <route.component {...props} {...route.props} route={route} />
            )}
          />
        );
      })}
    </Switch>
  );
};

export default createRoutes;
