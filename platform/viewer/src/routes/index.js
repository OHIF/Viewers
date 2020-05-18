import React from 'react';
import { Switch, Route } from 'react-router-dom';
// Route Components
import DataSourceWrapper from './DataSourceWrapper';
import StudyListContainer from './StudyListContainer';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';

// TODO: Make these configurable
const bakedInRoutes = [
  // WORK LIST
  {
    path: '/',
    exact: true,
    component: DataSourceWrapper,
    props: { children: StudyListContainer },
  },
  // NOT FOUND (404)
  { component: NotFound },
];

const createRoutes = (modes, dataSources, extensionManager, t, t2) => {
  console.log('Creating Routes: ', routes, bakedInRoutes);
  console.log(modes, dataSources, extensionManager, t, t2);
  if (!modes.length) {
    modes.push(window.exampleMode);
  }
  const routes = buildModeRoutes(modes, dataSources, extensionManager) || [];
  // TODO: Shouldn't need to guard input routes with an empty array?
  const allRoutes = [...(routes || []), ...bakedInRoutes];

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
