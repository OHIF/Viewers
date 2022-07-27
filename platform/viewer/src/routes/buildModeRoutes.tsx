import React from 'react';
import ModeRoute from '@routes/Mode';
import checkExtensionDependencies from './checkExtensionDependencies';

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
export default function buildModeRoutes({
  modes,
  dataSources,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}) {
  const routes = [];

  // const dataSources = Object.keys(extensionManager.dataSourceMap).map(a =>
  //   extensionManager.getDataSources(a)
  // );

  const dataSourceNames = [];

  dataSources.forEach(dataSource => {
    const { sourceName } = dataSource;
    if (!dataSourceNames.includes(sourceName)) {
      dataSourceNames.push(sourceName);
    }
  });

  modes.forEach(mode => {
    checkExtensionDependencies(mode, extensionManager);

    // todo: for each route. add route to path.
    dataSourceNames.forEach(dataSourceName => {
      const path = `/${mode.routeName}/${dataSourceName}`;

      // TODO move up.
      const children = () => (
        <ModeRoute
          mode={mode}
          dataSourceName={dataSourceName}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
          hotkeysManager={hotkeysManager}
          commandsManager={commandsManager}
        />
      );

      routes.push({
        path,
        children,
      });
    });

    const defaultDataSourceName = extensionManager.defaultDataSourceName;

    // Add default DataSource route.
    const path = `/${mode.routeName}`;

    // TODO move up.
    const children = () => (
      <ModeRoute
        mode={mode}
        dataSourceName={defaultDataSourceName}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        commandsManager={commandsManager}
        hotkeysManager={hotkeysManager}
        commandsManager={commandsManager}
      />
    );

    routes.push({
      path,
      children,
      private: true, // todo: all mode routes are private for now
    });
  });

  return routes;
}
