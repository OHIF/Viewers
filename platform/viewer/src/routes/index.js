import React from 'react';
import { Switch, Route } from 'react-router-dom';

import StudyListContainer from '../containers/StudyListContainer';
import ViewerContainer from '../containers/ViewerContainer';
import NotFound from '../containers/NotFound';

const appRoutes = [
  { path: '/', exact: true, component: StudyListContainer },
  { path: '/viewer/:studyInstanceUids', component: ViewerContainer },
  { component: NotFound },
];

const routes = () => {
  return (
    <Switch>
      {appRoutes.map((route, i) => {
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

export default routes;
