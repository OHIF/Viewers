import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Button, ErrorBoundary, Input } from '@ohif/ui';

// Route Components
import DataSourceWrapper from './DataSourceWrapper';
import WorkList from './WorkList';
import Local from './Local';
import Debug from './Debug';
import NotFound from './NotFound';
import buildModeRoutes from './buildModeRoutes';
import PrivateRoute from './PrivateRoute';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

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
  return (
    <div className="absolute flex h-full w-full items-center justify-center text-white">
      <div>
        <h4>
          One or more of the requested studies are not available at this time. Return to the{' '}
          <Link
            className="text-primary-light"
            to={'/'}
          >
            study list
          </Link>{' '}
          to select a different study to view.
        </h4>
      </div>
    </div>
  );
};

NotFoundStudy.propTypes = {
  message: PropTypes.string,
};

const RootWindow = () => {
  const [value, setValue] = React.useState('');
  // add form to add short url and when press OK, forward to the short url
  return (
    <div className="absolute flex h-full w-full items-center justify-center text-white">
      <div className="bg-secondary-dark mx-auto space-y-2 rounded-lg py-8 px-8 drop-shadow-md">
        <div className="max-w-3xl">
          <h1 className="mb-7 block text-2xl">Willkommen!</h1>
          <span className="mb-2 block">
            Diese Web Applikation dient ausschließlich der Demonstration von Floy Produkten. Legen
            Sie gerne den Ordner einer CT Abdomen, CT Thorax oder CT Wirbelsäulen Studie in der
            Mitte des Fensters ab. Alternativ können Sie über den Knopf in der linken oberen
            Bildschirmecke eine Studie auswählen. Drücken Sie in der unteren Leiste auf den
            Play-Button neben „KI ausführen“, sobald die Studie angezeigt wird. Je nach
            Internetverbindung und Dateigröße dauert die Anzeige des Ergebnis einige Minuten.
          </span>
          <span className="mb-2 block">
            Kontaktieren Sie zur Ergebnisbesprechung, bei Problemen oder für Fragen unseren
            Geschäftsführer Benedikt Schneider gerne direkt unter benedikt.schneider@floy.com oder
            +4915786031618.
          </span>
          <span className="mb-3 block">
            Bitte geben Sie hier Ihren Short URL ein, um Zugang zur Demo zu erhalten:
          </span>
          <div className="flex">
            <div className="mx-auto flex gap-[10px]">
              <Input
                className="max-w-xs rounded-lg text-xl"
                type="text"
                id="shortUrl"
                placeholder="Short URL"
                value={value}
                onChange={event => {
                  setValue(event.target.value);
                }}
              />
              <Button
                className="rounded-lg py-1.5 px-5 text-xl"
                onClick={() => {
                  if (!value) {
                    return;
                  }
                  window.location.href = '/short/' + value;
                }}
              >
                OK
              </Button>
            </div>
            <div className="flex flex-col">
              <Link
                className="text-primary-light"
                target="_blank"
                to={'https://www.floy.com/data-privacy'}
              >
                Datenschutz
              </Link>
              <Link
                className="text-primary-light"
                target="_blank"
                to={'https://www.floy.com/legal-notice'}
              >
                Impressum
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// TODO: Include "routes" debug route if dev build
const bakedInRoutes = [
  {
    path: '/notfoundserver',
    children: NotFoundServer,
  },
  {
    path: '/notfoundstudy',
    children: NotFoundStudy,
  },
  /*  {
    path: '/debug',
    children: Debug,
  },
  {
    path: '/local',
    children: Local.bind(null, { modePath: '' }), // navigate to the worklist
  },
  {
    path: '/localbasic',
    children: Local.bind(null, { modePath: 'viewer/dicomlocal' }),
  }, */
  {
    path: '/',
    children: RootWindow,
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
  routerBasename,
  showStudyList,
}) => {
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

  const WorkListRoute = {
    path: '/',
    children: DataSourceWrapper,
    private: true,
    props: { children: WorkList, servicesManager, extensionManager },
  };

  const customRoutes = customizationService.getGlobalCustomization('customRoutes');
  const allRoutes = [
    ...routes,
    ...(showStudyList ? [WorkListRoute] : []),
    ...(customRoutes?.routes || []),
    ...bakedInRoutes,
    customRoutes?.notFoundRoute || notFoundRoute,
  ];

  function RouteWithErrorBoundary({ route, ...rest }) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return (
      <ErrorBoundary
        context={`Route ${route.path}`}
        fallbackRoute="/"
      >
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

  // Note: PrivateRoutes in react-router-dom 6.x should be defined within
  // a Route element
  return (
    <Routes>
      {allRoutes.map((route, i) => {
        return route.private === true ? (
          <Route
            key={i}
            exact
            path={route.path}
            element={
              <PrivateRoute handleUnauthenticated={userAuthenticationService.handleUnauthenticated}>
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
