import React, { useContext, useEffect, useCallback } from 'react';
import { displaySetManager, ToolBarManager, useViewModel } from '@ohif/core';
import { DragAndDropProvider } from '@ohif/ui';
import Compose from './Compose';
import ViewportGrid from './../components/ViewportGrid';

export default function ModeRoute({
  location,
  mode,
  dataSourceName,
  extensionManager,
}) {
  const { routes, sopClassHandlers, extensions } = mode;
  const dataSources = extensionManager.getDataSources(dataSourceName);

  // Add toolbar state to the view model context?
  const {
    toolBarLayout,
    setToolBarLayout,
    displaySetInstanceUIDs,
    setDisplaySetInstanceUids,
  } = useViewModel();

  // TODO: For now assume one unique datasource.

  const dataSource = dataSources[0];
  const route = routes[0];

  let toolBarManager;

  useEffect(() => {
    toolBarManager = new ToolBarManager(extensionManager, setToolBarLayout);
    route.init({ toolBarManager });
  }, [mode, dataSourceName, location]);

  console.log(dataSource);

  const createDisplaySets = useCallback(() => {
    // Add SOPClassHandlers to a new SOPClassManager.
    displaySetManager.init(extensionManager, sopClassHandlers, {
      displaySetInstanceUIDs,
      setDisplaySetInstanceUids,
    });

    const queryParams = location.search;

    // Call the data source to start building the view model?
    dataSource.retrieve.series.metadata(
      queryParams,
      displaySetManager.makeDisplaySets
    );
  }, [displaySetInstanceUIDs, location]);

  useEffect(() => {
    createDisplaySets();
  }, [mode, dataSourceName, location]);

  // Only handling one route per mode for now
  // You can test via http://localhost:3000/example-mode/dicomweb
  const layoutTemplateData = route.layoutTemplate({ location });
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

  function ViewportGridWithDataSource(props) {
    return ViewportGrid({ ...props, dataSource });
  }

  return (
    <CombinedContextProvider>
      {/* TODO: extensionManager is already provided to the extension module.
       *  Use it from there instead of passing as a prop here.
       */}
      <DragAndDropProvider>
        <LayoutComponent
          extensionManager={extensionManager}
          displaySetInstanceUIDs={displaySetInstanceUIDs}
          toolBarLayout={toolBarLayout}
          ViewportGrid={ViewportGridWithDataSource}
          {...layoutTemplateData.props}
        />
      </DragAndDropProvider>
    </CombinedContextProvider>
  );
}
