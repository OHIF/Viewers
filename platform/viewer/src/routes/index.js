import React from 'react';
import { Routes, Route } from 'react-router-dom';
// Route Components
import DataSourceWrapper from './DataSourceWrapper';
import WorkList from './WorkList';
import Local from './Local';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';
import { ErrorBoundary } from '@ohif/ui';

// TODO: Make these configurable
// TODO: Include "routes" debug route if dev build
const bakedInRoutes = [
  // WORK LIST
  {
    path: '/',
    component: DataSourceWrapper,
    props: { children: WorkList },
  },
  {
    path: '/local',
    component: Local,
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
  routerBasename,
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

  debugger;

  function DynamicRoute({ route, ...rest }) {
    debugger;

    // eslint-disable-next-line react/jsx-props-no-spreading
    return (
      <ErrorBoundary context={`Route ${route.path}`} fallbackRoute="/">
        <route.component
          {...rest}
          {...route.props}
          route={route}
          servicesManager={servicesManager}
          hotkeysManager={hotkeysManager}
        />
      </ErrorBoundary>
    );
  }

  return (
    <Routes basename={routerBasename}>
      {allRoutes.map((route, i) => {
        return (
          <Route
            key={i}
            path={route.path}
            children={<DynamicRoute route={route} />}
          />
        );
      })}
    </Routes>
  );
};

export default createRoutes;
