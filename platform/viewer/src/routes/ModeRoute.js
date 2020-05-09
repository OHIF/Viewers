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
  // You can test via http://localhost:3000/example-mode/dicomweb
  const layoutTemplateData = routes[0].layoutTemplate({ location });

  const layoutTemplateModuleEntry = extensionManager.getModuleEntry(
    layoutTemplateData.id
  );

  const LayoutComponent = layoutTemplateModuleEntry.component;
  //const LayoutComponent = props => <div>{'Testing'}</div>;

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

  // For each extension, look up their context modules
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
