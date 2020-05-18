import React, { useEffect, useCallback } from 'react';
import {
  displaySetManager,
  ToolBarManager,
  useViewModel,
  useToolbarLayout,
  ToolbarLayoutProvider,
} from '@ohif/core';
import { DragAndDropProvider } from '@ohif/ui';
//
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';
import DisplaySetCreator from './DisplaySetCreator';


export default function ModeRoute({
  location,
  mode,
  dataSourceName,
  extensionManager,
}) {
  console.warn('ModeRoute rerendering');
  const { routes, extensions } = mode;
  const dataSources = extensionManager.getDataSources(dataSourceName);
  // TODO: For now assume one unique datasource.

  const dataSource = dataSources[0];
  const route = routes[0];

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
    <React.Fragment>
      <ToolbarLayoutProvider>
        <DisplaySetCreator
          location={location}
          mode={mode}
          dataSourceName={dataSourceName}
          extensionManager={extensionManager}
        />
        <CombinedContextProvider>
          {/* TODO: extensionManager is already provided to the extension module.
           *  Use it from there instead of passing as a prop here.
           */}
          <DragAndDropProvider>
            <LayoutComponent
              extensionManager={extensionManager}
              ViewportGrid={ViewportGridWithDataSource}
              {...layoutTemplateData.props}
            />
          </DragAndDropProvider>
        </CombinedContextProvider>
      </ToolbarLayoutProvider>
    </React.Fragment>
  );
}
