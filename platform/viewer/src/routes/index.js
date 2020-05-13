import React from 'react';
import { Switch, Route } from 'react-router-dom';

// Route Components
import DataSourceWrapper from './DataSourceWrapper';
import StudyListContainer from './StudyListContainer';
import NotFound from './NotFound';

const bakedInRoutes = [
  {
    path: '/',
    exact: true,
    component: DataSourceWrapper,
    props: { children: StudyListContainer },
  },
  { component: NotFound },
];

const createRoutes = routes => {
  console.log('Creating Routes: ', routes, bakedInRoutes);
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
