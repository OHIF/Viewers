import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import PropTypes from 'prop-types';
// TODO: DicomMetadataStore should be injected?
import { DicomMetadataStore, utils } from '@ohif/core';
import { DragAndDropProvider, ImageViewerProvider } from '@ohif/ui';
import { useQuery } from '@hooks';
import ViewportGrid from '@components/ViewportGrid';
import Compose from './Compose';

const { isLowPriorityModality } = utils;

export default function ModeRoute({
  location,
  mode,
  dataSourceName,
  extensionManager,
  servicesManager,
  hotkeysManager,
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

  const { extensions, sopClassHandlers, hotkeys } = mode;

  if (dataSourceName === undefined) {
    dataSourceName = extensionManager.defaultDataSourceName;
  }

  extensionManager.setActiveDataSource(dataSourceName);

  const dataSources = extensionManager.getActiveDataSource();

  // Only handling one instance of the datasource type (E.g. one DICOMWeb server)
  const dataSource = dataSources[0];
  // Only handling one route per mode for now
  const route = mode.routes[0];

  const {
    DisplaySetService,
    MeasurementService,
    ViewportGridService,
    HangingProtocolService,
  } = servicesManager.services;

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
    if (!hotkeys) {
      console.warn('[hotkeys] No bindings defined for hotkeys hook!');
      return;
    }

    hotkeysManager.setDefaultHotKeys(hotkeys);
    hotkeysManager.setHotkeys(hotkeys);

    return () => {
      hotkeysManager.destroy();
    };
  }, []);

  useEffect(() => {
    // TODO: For some reason this is running before the Providers
    // are calling setServiceImplementation
    // TOOD -> iterate through services.

    // Extension
    extensionManager.onModeEnter();
    mode?.onModeEnter({ servicesManager, extensionManager });
    // Mode
    route.init({ servicesManager, extensionManager });

    return () => {
      extensionManager.onModeExit();
      mode?.onModeExit({ servicesManager, extensionManager });
    };
  }, [
    mode,
    dataSourceName,
    location,
    route,
    servicesManager,
    extensionManager,
    hotkeysManager,
  ]);

  // This queries for series, but... What does it do with them?
  useEffect(() => {
    // Add SOPClassHandlers to a new SOPClassManager.
    DisplaySetService.init(extensionManager, sopClassHandlers);

    // TODO: This should be baked into core, not manuel?
    // DisplaySetService would wire this up?
    const { unsubscribe } = DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.INSTANCES_ADDED,
      ({ StudyInstanceUID, SeriesInstanceUID, madeInClient = false }) => {
        const seriesMetadata = DicomMetadataStore.getSeries(
          StudyInstanceUID,
          SeriesInstanceUID
        );

        DisplaySetService.makeDisplaySets(
          seriesMetadata.instances,
          madeInClient
        );
      }
    );

    StudyInstanceUIDsAsArray.forEach(StudyInstanceUID => {
      dataSource.retrieveSeriesMetadata({ StudyInstanceUID });
    });

    return unsubscribe;
  }, [
    mode,
    dataSourceName,
    location,
    DisplaySetService,
    extensionManager,
    sopClassHandlers,
    StudyInstanceUIDsAsArray,
    dataSource,
  ]);

  useEffect(() => {
    const { unsubscribe } = DicomMetadataStore.subscribe(
      DicomMetadataStore.EVENTS.SERIES_ADDED,
      ({ StudyInstanceUID }) => {
        const studyMetadata = DicomMetadataStore.getStudy(StudyInstanceUID);

        const sortedSeries = studyMetadata.series.sort((a, b) => {
          const aLowPriority = isLowPriorityModality(a.Modality);
          const bLowPriority = isLowPriorityModality(b.Modality);
          if (!aLowPriority && bLowPriority) {
            return -1;
          }
          if (aLowPriority && !bLowPriority) {
            return 1;
          }

          return a.SeriesNumber - b.SeriesNumber;
        });

        const { SeriesInstanceUID } = sortedSeries[0];

        HangingProtocolService.setHangingProtocol({
          /*protocolMatchingRules: [
              {
                id: '7tmuq7KzDMCWFeapc',
                weight: 2,
                required: false,
                attribute: 'x00081030',
                constraint: {
                  contains: {
                    value: 'DFCI CT CHEST',
                  },
                },
              },
            ],*/
          stages: [
            {
              /*id: 'v5PfGt9F6mffZPif5',
                viewportStructure: {
                  type: 'grid',
                  properties: {
                    Rows: 1,
                    Columns: 1,
                  },
                  layoutTemplateName: 'gridLayout',
                },*/
              viewports: [
                {
                  viewportSettings: {},
                  imageMatchingRules: [],
                  seriesMatchingRules: [
                    {
                      id: 'mXnsCcNzZL56z7mTZ',
                      weight: 1,
                      required: true,
                      attribute: 'SeriesInstanceUID',
                      constraint: {
                        equals: {
                          value: SeriesInstanceUID,
                        },
                      },
                    },
                  ],
                  studyMatchingRules: [],
                },
              ],
            },
          ],
        });
      }
    );
    return unsubscribe;
  }, [
    mode,
    dataSourceName,
    location,
    DisplaySetService,
    extensionManager,
    sopClassHandlers,
    StudyInstanceUIDsAsArray,
    dataSource,
  ]);

  return (
    <ImageViewerProvider
      initialState={{ StudyInstanceUIDs: StudyInstanceUIDsAsArray }}
    >
      <CombinedContextProvider>
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
  hotkeysManager: PropTypes.object,
};
