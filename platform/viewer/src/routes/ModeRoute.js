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
  const LayoutComponent = extensionManager.getModuleEntry(
    routes[0].layoutTemplate
  );

  // Add SOPClassHandlers to a new SOPClassManager.
  const manager = new SOPClassHandlerManager(
    extensionManager,
    sopClassHandlers
  );

  const queryParams = location.search;

  // Call the data source to start building the view model?
  //dataSource(queryParams);

  //metadataStore.onModified();

  const onUpdatedCallback = () => {
    // TODO: This should append, not create from scratch so we don't nuke existing display sets
    // when e.g. a new series arrives
    manager.createDisplaySets.then(setDisplaySetInstanceUids);
  };

  const contextModules = extensions.getContextModules();
  const contextModuleProviders = contextModules.map(a => a.context.Provider);
  const CombinedContextProvider = Compose(contextModuleProviders);

  return (
    <CombinedContextProvider>
      <LayoutComponent displaySetInstanceUids={displaySetInstanceUids} />
    </CombinedContextProvider>
  );
}
