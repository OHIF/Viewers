import React from 'react';
import ModeRoute from '@routes/Mode';

/*
  Routes uniquely define an entry point to:
  - A mode
  - A mode route
  - A data source
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

  Additionally, not specifying a modeRoute will default to the first route defined in the mode:

  /:modeId/?queryParameters=example

  You can still specify a sourceType in this case - the first mode route will be used with the specified sourceType:

  /:modeId/:sourceType/?queryParameters=example
 */
export default function buildModeRoutes({
  modes,
  dataSources,
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
}: withAppTypes) {
  const routes = [];
  const dataSourceNames = [];

  dataSources.forEach(dataSource => {
    const { sourceName } = dataSource;
    if (!dataSourceNames.includes(sourceName)) {
      dataSourceNames.push(sourceName);
    }
  });
  const allPaths = new Set<string>();
  modes.forEach(mode => {
    dataSourceNames.forEach(dataSourceName => {
      const datasourcePath = `/${mode.routeName}/${dataSourceName}`;
      if (allPaths.has(datasourcePath)) {
        console.warn(
          `Duplicate path '${datasourcePath}' in buildModeRoutes, mode ${mode.routeName}, dataSource ${dataSourceName}`
        );
      }
      allPaths.add(datasourcePath);
      // TODO move up.
      const children = () => (
        <ModeRoute
          mode={mode}
          dataSourceName={dataSourceName}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
          hotkeysManager={hotkeysManager}
        />
      );

      routes.push({
        path: datasourcePath,
        children,
        private: true,
      });

      mode.routes.forEach(route => {
        const path = `/${mode.routeName}/${route.path}/${dataSourceName}`;
        if (allPaths.has(path)) {
          console.warn(
            `Duplicate path '${path}' in buildModeRoutes, mode ${mode.routeName}, route ${route.path}, dataSource ${dataSourceName}`
          );
        }
        allPaths.add(path);
        // TODO move up.
        const children = () => (
          <ModeRoute
            mode={mode}
            modeRoutePath={route.path}
            dataSourceName={dataSourceName}
            extensionManager={extensionManager}
            servicesManager={servicesManager}
            commandsManager={commandsManager}
            hotkeysManager={hotkeysManager}
          />
        );

        routes.push({
          path,
          children,
          private: true,
        });
      });
    });

    // Add active DataSource route.
    // This is the DataSource route for the active data source defined in ExtensionManager.getActiveDataSource
    const modePath = `/${mode.routeName}`;

    // TODO move up.
    const children = () => (
      <ModeRoute
        mode={mode}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        commandsManager={commandsManager}
        hotkeysManager={hotkeysManager}
      />
    );

    if (allPaths.has(modePath)) {
      console.warn(`Duplicate path '${modePath}' in buildModeRoutes, mode ${mode.routeName}`);
    }
    allPaths.add(modePath);

    routes.push({
      path: modePath,
      children,
      private: true,
    });

    mode.routes.forEach(route => {
      const path = `/${mode.routeName}/${route.path}`;
      if (allPaths.has(path)) {
        console.warn(
          `Duplicate path '${path}' in buildModeRoutes, mode ${mode.routeName}, route ${route.path}`
        );
      }
      allPaths.add(path);

      const children = () => (
        <ModeRoute
          mode={mode}
          modeRoutePath={route.path}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
          hotkeysManager={hotkeysManager}
        />
      );

      routes.push({
        path,
        children,
        private: true,
      });
    });
  });

  return routes;
}
