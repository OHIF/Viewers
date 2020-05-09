import React from 'react';
import ModeRoute from './ModeRoute';
import { ViewModelProvider } from './ViewModelContext';

/*
  Routes uniquely define an entry point to:
  - A mode
  - Linked to a data source
  - With a specified data set.

  The full route template is:

  /:modeId/:modeRoute/:sourceType/?queryParameters=example

  Where:
  :modeId - Is the mode selected.
  :modeRoute - Is the route within the mode to select.
  :sourceType - Is the data source identifier, which specifies which DataSource to use.
  ?queryParameters - Are query parameters as defined by data source.

  A default source can be specified at the app level configuration, and then that source is used if :sourceType is omitted:

  /:modeId/:modeRoute/?queryParameters=example
 */
export default function buildModeRoutes(modes, extensionManager) {
  const routes = [];

  // TODO: Build api for this.
  // Currently builds an endpoint for all data sources, which probably
  // doesn't make sense
  const dataSources = Object.keys(extensionManager.dataSourceMap).map(a =>
    extensionManager.getDataSource(a)
  );

  modes.forEach(mode => {
    dataSources.forEach(dataSource => {
      // TODO: name vs id
      const dataSourceId = dataSource.name;
      const path = `/${mode.id}/${dataSourceId}`;

      const component = ({ location }) => (
        <ViewModelProvider>
          <ModeRoute
            location={location}
            mode={mode}
            dataSourceId={dataSourceId}
            extensionManager={extensionManager}
          />
        </ViewModelProvider>
      );

      routes.push({
        path,
        component,
        exact: true,
      });
    });
  });

  return routes;
}
