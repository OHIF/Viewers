import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@ohif/ui-next';

// Route Components
import Local from './Local';
import Debug from './Debug';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';
import PrivateRoute from './PrivateRoute';
import PropTypes from 'prop-types';
import { routerBasename } from '../utils/publicUrl';
import { useAppConfig } from '@state';
import { history } from '../utils/history';

const NotFoundServer = ({
  message = 'Unable to query for studies at this time. Check your data source configuration or network connection',
}) => {
  return (
    <div className="absolute flex h-full w-full items-center justify-center text-white">
      <div>
        <h4>{message}</h4>
      </div>
    </div>
  );
};

NotFoundServer.propTypes = {
  message: PropTypes.string,
};

const NotFoundStudy = () => {
  const [appConfig] = useAppConfig();
  const { showStudyList } = appConfig;

  return (
    <div className="absolute flex h-full w-full items-center justify-center text-white">
      <div>
        <h4>One or more of the requested studies are not available at this time.</h4>
        {showStudyList && (
          <p className="mt-2">
            Return to the{' '}
            <Link
              className="text-primary-light"
              to="/"
            >
              study list
            </Link>{' '}
            to select a different study to view.
          </p>
        )}
      </div>
    </div>
  );
};

NotFoundStudy.propTypes = {
  message: PropTypes.string,
};

const Home = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-8">
        <div className="border-secondary-light bg-secondary-dark/50 flex h-48 w-[500px] items-center justify-center rounded border-2 border-dashed">
          <p className="px-8 text-center text-lg">
            Drop a DICOM file or folder of DICOM files here
          </p>
        </div>
        <Link
          className="bg-primary rounded px-6 py-3 text-lg font-semibold text-black"
          to="/viewer?StudyInstanceUIDs=1.2.276.0.7230010.3.1.2.2155604110.4180.1021041295.21"
        >
          Go to Viewer
        </Link>
      </div>
    </div>
  );
};

// TODO: Include "routes" debug route if dev build
const bakedInRoutes = [
  {
    path: `/notfoundserver`,
    children: NotFoundServer,
  },
  {
    path: `/notfoundstudy`,
    children: NotFoundStudy,
  },
  {
    path: `/debug`,
    children: Debug,
  },
  {
    path: `/local`,
    children: Local.bind(null, { modePath: '' }), // navigate to the worklist
  },
  {
    path: `/localbasic`,
    children: Local.bind(null, { modePath: 'viewer/dicomlocal' }),
  },
];

// NOT FOUND (404)
const notFoundRoute = { component: NotFound };

const createRoutes = ({
  modes,
  dataSources,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}: withAppTypes) => {
  const routes =
    buildModeRoutes({
      modes,
      dataSources,
      extensionManager,
      servicesManager,
      commandsManager,
      hotkeysManager,
    }) || [];

  const { customizationService } = servicesManager.services;

  const path =
    routerBasename.length > 1 && routerBasename.endsWith('/')
      ? routerBasename.substring(0, routerBasename.length - 1)
      : routerBasename;

  console.log('Registering worklist route', routerBasename, path);

  const HomeRoute = {
    path: '/',
    children: Home,
    private: false,
  };

  const customRoutes = customizationService.getCustomization('routes.customRoutes');

  const allRoutes = [
    HomeRoute,
    ...routes,
    ...(customRoutes?.routes || []),
    ...bakedInRoutes,
    customRoutes?.notFoundRoute || notFoundRoute,
  ];

  function RouteWithErrorBoundary({ route, ...rest }) {
    history.navigate = useNavigate();

    // eslint-disable-next-line react/jsx-props-no-spreading
    return (
      <ErrorBoundary context={`Route ${route.path}`}>
        <route.children
          {...rest}
          {...route.props}
          route={route}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          hotkeysManager={hotkeysManager}
        />
      </ErrorBoundary>
    );
  }

  const { userAuthenticationService } = servicesManager.services;

  // All routes are private by default and then we let the user auth service
  // to check if it is enabled or not
  // Todo: I think we can remove the second public return below
  return (
    <Routes>
      {allRoutes.map((route, i) => {
        return route.private === true ? (
          <Route
            key={i}
            path={route.path}
            element={
              <PrivateRoute
                handleUnauthenticated={() => userAuthenticationService.handleUnauthenticated()}
              >
                <RouteWithErrorBoundary route={route} />
              </PrivateRoute>
            }
          ></Route>
        ) : (
          <Route
            key={i}
            path={route.path}
            element={<RouteWithErrorBoundary route={route} />}
          />
        );
      })}
    </Routes>
  );
};

export default createRoutes;
