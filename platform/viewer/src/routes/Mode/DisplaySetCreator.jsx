import { useEffect, useCallback } from 'react';
import {
  displaySetManager,
  ToolBarManager,
  useViewModel,
  useToolbarLayout,
} from '@ohif/core';

export default function DisplaySetCreator({
  location,
  mode,
  dataSourceName,
  extensionManager,
  DisplaySetService,
}) {
  console.warn('DisplaySetCreator rerendering');
  const { routes, sopClassHandlers } = mode;
  const dataSources = extensionManager.getDataSources(dataSourceName);
  // TODO: For now assume one unique datasource.

  const dataSource = dataSources[0];
  const route = routes[0];

  // Add toolbar state to the view model context?
  const { displaySetInstanceUIDs, setDisplaySetInstanceUIDs } = useViewModel();

  const { toolBarLayout, setToolBarLayout } = useToolbarLayout();

  useEffect(() => {
    let toolBarManager = new ToolBarManager(extensionManager, setToolBarLayout);
    route.init({ toolBarManager });
  }, [mode, dataSourceName, location]);

  const createDisplaySets = useCallback(() => {
    // Add SOPClassHandlers to a new SOPClassManager.
    displaySetManager.init(extensionManager, sopClassHandlers, {
      displaySetInstanceUIDs,
      setDisplaySetInstanceUIDs,
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

  return null;
}
