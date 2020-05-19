import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
//
import { DragAndDropProvider } from '@ohif/ui';
//
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';

export default function ModeRoute({
  location,
  mode,
  dataSourceName,
  extensionManager,
  servicesManager,
}) {
  const { routes, extensions, sopClassHandlers } = mode;
  const dataSources = extensionManager.getDataSources(dataSourceName);
  // TODO: For now assume one unique datasource.

  const dataSource = dataSources[0];
  const route = routes[0];

  const { DisplaySetService } = servicesManager.services;

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

  useEffect(() => {
    route.init({ servicesManager, extensionManager });
  }, [mode, dataSourceName, location]);

  const createDisplaySets = useCallback(() => {
    // Add SOPClassHandlers to a new SOPClassManager.
    DisplaySetService.init(extensionManager, sopClassHandlers);

    const queryParams = location.search;

    // Call the data source to start building the view model?
    dataSource.retrieve.series.metadata(
      queryParams,
      DisplaySetService.makeDisplaySets
    );
  }, [location]);

  useEffect(() => {
    createDisplaySets();
  }, [mode, dataSourceName, location]);

  return (
    <React.Fragment>
      {/*<ToolbarLayoutProvider>*/}
      <CombinedContextProvider>
        {/* TODO: extensionManager is already provided to the extension module.
         *  Use it from there instead of passing as a prop here.
         */}
        <DragAndDropProvider>
          <LayoutComponent
            {...layoutTemplateData.props}
            ViewportGridComp={ViewportGridWithDataSource}
          />
        </DragAndDropProvider>
      </CombinedContextProvider>
      {/*</ToolbarLayoutProvider>*/}
    </React.Fragment>
  );
}

ModeRoute.propTypes = {
  // Ref: https://reacttraining.com/react-router/web/api/location
  location: PropTypes.shape({
    key: PropTypes.string,
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
    hash: PropTypes.string.isRequired,
    //state: PropTypes.object.isRequired,
  }),
  mode: PropTypes.object.isRequired,
  dataSourceName: PropTypes.string,
  extensionManager: PropTypes.object,
};
