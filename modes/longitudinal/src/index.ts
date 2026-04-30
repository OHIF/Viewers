import i18n from 'i18next';
import { id } from './id';
import { initToolGroups, toolbarButtons, cornerstone,
  ohif,
  dicomsr,
  dicomvideo,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
 } from '@ohif/mode-basic';
 import { ToolbarService } from '@ohif/core';

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
};

export const longitudinalInstance = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    leftPanels: [tracked.thumbnailList],
    rightPanels: [cornerstone.segmentation, tracked.measurements],
    viewports: [
      {
        namespace: tracked.viewport,
        // Re-use the display sets from basic
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      ...basicLayout.props.viewports,
      ],
    }
  };

  export const testTaskInstance = {
    ...basicLayout,
    id: ohif.layout,
    props: {
      ...basicLayout.props,
      leftPanels: [tracked.measurements],
      rightPanels: [cornerstone.segmentation, tracked.thumbnailList],
      viewports: [
        {
          namespace: tracked.viewport,
          // Re-use the display sets from basic
          displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
        },
        ...basicLayout.props.viewports,
        ],
      }
    };

export const longitudinalRoute =
    {
      ...basicRoute,
      path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
      layoutInstance: longitudinalInstance,
    };

    export const testTaskRoute =
    {
      ...basicRoute,
      path: 'test-task',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
      layoutInstance: testTaskInstance,
    };

const moreTools = basicModeInstance.toolbarSections['MoreTools'].filter(item => item !== 'Angle');
const measurementTools = ['Angle',...basicModeInstance.toolbarSections['MeasurementTools']];

export const modeInstance = {
    ...basicModeInstance,
    toolbarSections: {
      ...basicModeInstance.toolbarSections,
      MoreTools: moreTools,
      MeasurementTools: measurementTools,
    },
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'viewer',
    displayName: i18n.t('Modes:Basic Viewer'),
    routes: [
      testTaskRoute
    ],
    extensions: extensionDependencies,
  };

const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { initToolGroups, toolbarButtons };
