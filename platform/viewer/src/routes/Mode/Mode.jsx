import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import PropTypes from 'prop-types';
//
import { ToolBarManager } from '@ohif/core';
import { DragAndDropProvider, ImageViewerProvider } from '@ohif/ui';
//
import { useQuery } from '@hooks';
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';

export default function ModeRoute({
  location,
  mode,
  dataSourceName,
  extensionManager,
  servicesManager,
}) {
  // Parse route params/querystring
  const query = useQuery();
  const queryStudyInstanceUIDs = query.get('StudyInstanceUIDs');
  const { StudyInstanceUIDs: paramsStudyInstanceUIDs } = useParams();
  const StudyInstanceUIDs = queryStudyInstanceUIDs || paramsStudyInstanceUIDs;
  const StudyInstanceUIDsAsArray =
    StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
      ? StudyInstanceUIDs
      : [StudyInstanceUIDs];

  const { extensions, sopClassHandlers } = mode;
  // TODO:
  // - Check query/params for specific dataSource
  //     - If provided, query for that dataSource instance
  //     - If not provided, select default datasource
  // - Update `extensionManager` to have a method to retrieve the default source
  const dataSources = extensionManager.getDataSources(dataSourceName);
  const dataSource = dataSources[0];
  const route = mode.routes[0];

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
  }, [
    mode,
    dataSourceName,
    location,
    route,
    servicesManager,
    extensionManager,
  ]);

  // This queries for series, but... What does it do with them?
  useEffect(() => {
    // Add SOPClassHandlers to a new SOPClassManager.
    DisplaySetService.init(extensionManager, sopClassHandlers);

    const queryParams = location.search;
    console.log('queryParams: ', queryParams);

    // Call the data source to start building the view model?
    dataSource.retrieve.series.metadata(
      queryParams,
      DisplaySetService.makeDisplaySets
    );
  }, [
    mode,
    dataSourceName,
    location,
    DisplaySetService,
    extensionManager,
    sopClassHandlers,
    dataSource.retrieve.series,
  ]);

  const reducer = (state, action) => {
    console.log(state, action);
  };

  return (
    <ImageViewerProvider
      initialState={{ StudyInstanceUIDs: StudyInstanceUIDsAsArray }}
      reducer={reducer}
    >
      <CombinedContextProvider>
        {/* TODO: extensionManager is already provided to the extension module.
         *  Use it from there instead of passing as a prop here.
         */}
        <DragAndDropProvider>
          <LayoutComponent
            {...layoutTemplateData.props}
            StudyInstanceUIDs={StudyInstanceUIDs}
            ViewportGridComp={ViewportGridWithDataSource}
          />
        </DragAndDropProvider>
      </CombinedContextProvider>
    </ImageViewerProvider>
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
  servicesManager: PropTypes.object,
};
