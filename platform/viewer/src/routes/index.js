import React from 'react';
import { Switch, Route } from 'react-router-dom';

// Route Components
import StudyListContainer from './StudyListContainer';
import NotFound from './NotFound';

const bakedInRoutes = [
  { path: '/', exact: true, component: StudyListContainer },
  { component: NotFound },
];

const createRoutes = routes => {
  console.log('Creating Routes: ', routes, bakedInRoutes);
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
            // eslint-disable-next-line react/jsx-props-no-spreading
            render={props => <route.component {...props} route={route} />}
          />
        );
      })}
    </Switch>
  );
};

export default createRoutes;
