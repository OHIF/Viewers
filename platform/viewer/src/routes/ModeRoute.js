import React, { useContext } from 'react';
import SOPClassHandlerManager from './SOPClassHandlerManager';
import ViewModelContext from './ViewModelContext';
import Compose from './Compose';

export default function ModeRoute({
  location,
  mode,
  dataSourceId,
  extensionManager,
}) {
  const { routes, sopClassHandlers, extensions } = mode;
  const dataSource = extensionManager.getDataSource(dataSourceId);

  const { displaySetInstanceUids, setDisplaySetInstanceUids } = useContext(
    ViewModelContext
  );
  // Deal with toolbar.

  // Only handling one route per mode for now
  const layoutTemplateData = routes[0].layoutTemplate({ location });
  /*const LayoutComponent = extensionManager.getModuleEntry(
    layoutTemplateData.id
  );*/

  // You can test via http://localhost:3000/example-mode/dicomweb
  const LayoutComponent = () => (
    <div>
      {`Reached the route for Mode: ${mode.id} and Data Source: ${dataSourceId}`}
    </div>
  );

  // Add SOPClassHandlers to a new SOPClassManager.
  /*const manager = new SOPClassHandlerManager(
    extensionManager,
    sopClassHandlers
  );*/

  const queryParams = location.search;

  // Call the data source to start building the view model?
  //dataSource(queryParams);

  //metadataStore.onModified();

  const onUpdatedCallback = () => {
    // TODO: This should append, not create from scratch so we don't nuke existing display sets
    // when e.g. a new series arrives
    //manager.createDisplaySets.then(setDisplaySetInstanceUids);
  };

  // TODO: For each extension, look up their context modules
  //const contextModules = extensions.getContextModules();
  //const contextModuleProviders = contextModules.map(a => a.context.Provider);
  //const CombinedContextProvider = Compose(contextModuleProviders);

  return (
    <LayoutComponent
      displaySetInstanceUids={displaySetInstanceUids}
      {...layoutTemplateData.props}
    />
  );

  /*return (
    <CombinedContextProvider>
      <LayoutComponent
        displaySetInstanceUids={displaySetInstanceUids}
        {...layoutTemplateData.props}
      />
    </CombinedContextProvider>
  );*/
}
