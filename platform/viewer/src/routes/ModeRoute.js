import React, { useContext, useEffect, useCallback } from 'react';
import { displaySetManager } from '@ohif/core';
import ViewModelContext from './ViewModelContext';
import Compose from './Compose';

export default function ModeRoute({
  location,
  mode,
  dataSourceName,
  extensionManager,
}) {
  const { routes, sopClassHandlers, extensions } = mode;
  const dataSources = extensionManager.getDataSources(dataSourceName);

  // TODO: For now assume one unique datasource.

  const dataSource = dataSources[0];

  console.log(dataSource);

  const { displaySetInstanceUids, setDisplaySetInstanceUids } = useContext(
    ViewModelContext
  );

  const createDisplaySets = useCallback(() => {
    // Add SOPClassHandlers to a new SOPClassManager.
    displaySetManager.init(extensionManager, sopClassHandlers, {
      displaySetInstanceUids,
      setDisplaySetInstanceUids,
    });

    const queryParams = location.search;

    // Call the data source to start building the view model?
    dataSource.retrieve.series.metadata(
      queryParams,
      displaySetManager.makeDisplaySets
    );
  }, [displaySetInstanceUids, location]);

  useEffect(() => {
    createDisplaySets();
  }, [mode, dataSourceName, location]);

  // Deal with toolbar.

  // Only handling one route per mode for now
  // You can test via http://localhost:3000/example-mode/dicomweb
  const layoutTemplateData = routes[0].layoutTemplate({ location });
  const layoutTemplateModuleEntry = extensionManager.getModuleEntry(
    layoutTemplateData.id
  );
  const LayoutComponent = layoutTemplateModuleEntry.component;

  // For each extension, look up their context modules
  // TODO: move to extension manager.
  let contextModules = [];
  extensions.forEach(extensionId => {
    const allRegisteredModuleIds = Object.keys(extensionManager.modulesMap);
    const moduleIds = allRegisteredModuleIds.filter(id =>
      id.includes(`${extensionId}.contextModule.`)
    );

    if (!moduleIds || !moduleIds.length) {
      return;
    }

    const modules = moduleIds.map(extensionManager.getModuleEntry);
    contextModules = contextModules.concat(modules);
  });

  const contextModuleProviders = contextModules.map(a => a.provider);
  const CombinedContextProvider = ({ children }) =>
    Compose({ components: contextModuleProviders, children });

  return (
    <CombinedContextProvider>
      <LayoutComponent
        extensionManager={extensionManager}
        displaySetInstanceUids={displaySetInstanceUids}
        {...layoutTemplateData.props}
      />
    </CombinedContextProvider>
  );
}
